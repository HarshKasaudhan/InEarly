import base64
import logging
import math
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from PIL import Image
import torch
import timm
from huggingface_hub import hf_hub_download
import onnxruntime as ort

logger = logging.getLogger("inearly.face_analysis")

# Emotion labels corresponding to SEARO1/FER_model (FER2013 dataset classes)
EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]

# Clinical affective mapping for Inearly companion
AFFECTIVE_MAPPINGS = {
    "angry": {
        "affective_state": "agitated_overwhelmed",
        "description": "Heightened agitation or frustration detected",
        "empathy_guidance": "The user appears frustrated or stressed. Validate their emotional weight, avoid pushy questions, and offer a calming, non-judgmental space.",
        "avatar_mood": "calm",
    },
    "disgust": {
        "affective_state": "distressed_aversive",
        "description": "Feelings of discomfort or strong aversion",
        "empathy_guidance": "The user exhibits signs of mental exhaustion or discomfort. Acknowledge that things may feel overwhelming right now.",
        "avatar_mood": "empathetic",
    },
    "fear": {
        "affective_state": "anxious_apprehensive",
        "description": "Heightened anxiety, nervousness, or panic cues",
        "empathy_guidance": "The user shows visible signs of anxiety or panic. Prioritize box breathing, grounding exercises, and reassuring warmth before exploring complex thoughts.",
        "avatar_mood": "empathetic",
    },
    "happy": {
        "affective_state": "positive_receptive",
        "description": "Positive, open, and uplifted emotional cues",
        "empathy_guidance": "The user presents positive emotional energy. Celebrate their wins and gently reinforce their positive coping resilience.",
        "avatar_mood": "happy",
    },
    "neutral": {
        "affective_state": "steady_calm",
        "description": "Balanced, grounded, or introspective state",
        "empathy_guidance": "The user is in a balanced, reflective state. Engage in steady, attentive listening.",
        "avatar_mood": "neutral",
    },
    "sad": {
        "affective_state": "low_mood_vulnerable",
        "description": "Feelings of sadness, grief, or fatigue",
        "empathy_guidance": "The user appears noticeably low or heavy-hearted. Offer gentle, empathetic active listening with zero unsolicited advice.",
        "avatar_mood": "empathetic",
    },
    "surprise": {
        "affective_state": "heightened_alert",
        "description": "Elevated curiosity or sudden unexpected realization",
        "empathy_guidance": "The user shows elevated alertness. Maintain steady presence and help them unpack their thoughts.",
        "avatar_mood": "neutral",
    },
}


class CustomSwinTransformer(torch.nn.Module):
    """
    Swin Transformer classifier head tailored for SEARO1/FER_model.
    Backbone: swin_base_patch4_window7_224
    Classifier: Linear(backbone.num_features, 512) -> ReLU -> Dropout(0.6) -> Linear(512, 7)
    """

    def __init__(self, pretrained: bool = False, num_classes: int = 7):
        super().__init__()
        self.backbone = timm.create_model(
            "swin_base_patch4_window7_224", pretrained=pretrained, num_classes=0
        )
        self.classifier = torch.nn.Sequential(
            torch.nn.Linear(self.backbone.num_features, 512),
            torch.nn.ReLU(),
            torch.nn.Dropout(p=0.6),
            torch.nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)
        return self.classifier(features)


class FaceAnalysisService:
    """
    Integrated Dual-Model Face Perception Pipeline:
    1. Anti-Spoofing & Liveness: MiniFASNet V2 (garciafido/minifasnet-v2-anti-spoofing-onnx) via ONNX Runtime
    2. Facial Emotion Recognition: Swin Transformer (SEARO1/FER_model) via PyTorch
    """

    def __init__(self):
        self._fas_session: Optional[ort.InferenceSession] = None
        self._fer_model: Optional[CustomSwinTransformer] = None
        self._face_cascade: Optional[cv2.CascadeClassifier] = None
        self._models_loaded: bool = False
        self._load_error: Optional[str] = None

    def _ensure_face_detector(self) -> cv2.CascadeClassifier:
        if self._face_cascade is None:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self._face_cascade = cv2.CascadeClassifier(cascade_path)
        return self._face_cascade

    def _ensure_models(self) -> bool:
        """
        Lazy-loads and caches both models from Hugging Face Hub.
        """
        if self._models_loaded:
            return True

        try:
            # 1. Load MiniFASNet v2 Anti-Spoofing ONNX Session
            if self._fas_session is None:
                logger.info("Loading MiniFASNet v2 Anti-Spoofing model from Hugging Face...")
                fas_path = hf_hub_download(
                    repo_id="garciafido/minifasnet-v2-anti-spoofing-onnx",
                    filename="minifasnet_v2.onnx",
                )
                self._fas_session = ort.InferenceSession(fas_path, providers=["CPUExecutionProvider"])
                logger.info("MiniFASNet v2 Anti-Spoofing model loaded successfully.")

            # 2. Load SEARO1/FER_model Swin Transformer
            if self._fer_model is None:
                logger.info("Loading SEARO1/FER_model Swin Transformer weights from Hugging Face...")
                fer_path = hf_hub_download(
                    repo_id="SEARO1/FER_model",
                    filename="best_model.pth",
                )
                model = CustomSwinTransformer(pretrained=False, num_classes=7)
                checkpoint = torch.load(fer_path, map_location="cpu", weights_only=False)
                if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                    model.load_state_dict(checkpoint["state_dict"], strict=False)
                elif isinstance(checkpoint, dict):
                    model.load_state_dict(checkpoint, strict=False)
                model.eval()
                self._fer_model = model
                logger.info("SEARO1/FER_model Swin Transformer loaded successfully.")

            self._models_loaded = True
            return True
        except Exception as e:
            logger.error(f"Failed to load face analysis models: {e}", exc_info=True)
            self._load_error = str(e)
            return False

    @staticmethod
    def decode_base64_image(image_base64: str) -> np.ndarray:
        """
        Decodes a base64 encoded data URI or raw string into a BGR numpy image.
        """
        # Strip header if present (e.g. data:image/jpeg;base64,...)
        cleaned = re.sub(r"^data:image/[a-zA-Z0-9.+_-]+;base64,", "", image_base64.strip())
        image_bytes = base64.b64decode(cleaned)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image from provided base64 data.")
        return img

    def detect_primary_face(
        self, img_bgr: np.ndarray
    ) -> Tuple[Optional[Tuple[int, int, int, int]], int]:
        """
        Detects primary face bounding box (x, y, w, h) in the image.
        Returns ((x, y, w, h), total_faces_count).
        """
        detector = self._ensure_face_detector()
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = detector.detectMultiScale(
            gray,
            scaleFactor=1.15,
            minNeighbors=5,
            minSize=(60, 60),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )

        if len(faces) == 0:
            return None, 0

        # Choose the largest detected face box by area
        largest_face = max(faces, key=lambda b: b[2] * b[3])
        return tuple(map(int, largest_face)), len(faces)

    @staticmethod
    def crop_face_scaled(
        img_bgr: np.ndarray, bbox: Tuple[int, int, int, int], scale: float = 2.7
    ) -> np.ndarray:
        """
        Crops face with scale factor around center with zero-padding (required by MiniFASNet).
        """
        h_img, w_img, _ = img_bgr.shape
        x, y, w, h = bbox

        cx = x + w / 2.0
        cy = y + h / 2.0
        box_size = max(w, h) * scale

        x1 = int(math.floor(cx - box_size / 2.0))
        y1 = int(math.floor(cy - box_size / 2.0))
        x2 = int(math.ceil(cx + box_size / 2.0))
        y2 = int(math.ceil(cy + box_size / 2.0))

        crop_w = x2 - x1
        crop_h = y2 - y1

        # Coordinates inside target cropped canvas
        pad_left = max(0, -x1)
        pad_top = max(0, -y1)
        pad_right = max(0, x2 - w_img)
        pad_bottom = max(0, y2 - h_img)

        src_x1 = max(0, x1)
        src_y1 = max(0, y1)
        src_x2 = min(w_img, x2)
        src_y2 = min(h_img, y2)

        cropped_canvas = np.zeros((crop_h, crop_w, 3), dtype=np.uint8)

        target_x1 = pad_left
        target_y1 = pad_top
        target_x2 = target_x1 + (src_x2 - src_x1)
        target_y2 = target_y1 + (src_y2 - src_y1)

        if (src_x2 > src_x1) and (src_y2 > src_y1):
            cropped_canvas[target_y1:target_y2, target_x1:target_x2] = img_bgr[src_y1:src_y2, src_x1:src_x2]

        return cropped_canvas

    def evaluate_liveness(
        self, img_bgr: np.ndarray, bbox: Tuple[int, int, int, int]
    ) -> Dict[str, Any]:
        """
        Runs MiniFASNet v2 Anti-Spoofing on 2.7x scale 80x80 BGR face crop.
        Returns:
            - status: "passed" | "failed" | "uncertain"
            - live_confidence: float
            - spoof_detected: bool
            - attack_type: "none" | "print_attack" | "screen_replay"
            - raw_probabilities: [live, print, replay]
        """
        if not self._ensure_models() or self._fas_session is None:
            # Fallback if model fails to load
            return {
                "status": "uncertain",
                "live_confidence": 0.5,
                "spoof_detected": False,
                "attack_type": "none",
                "raw_probabilities": [0.5, 0.25, 0.25],
                "error": self._load_error or "Anti-spoofing session not initialized",
            }

        # 1. 2.7x face crop & 80x80 BGR resize
        crop = self.crop_face_scaled(img_bgr, bbox, scale=2.7)
        resized = cv2.resize(crop, (80, 80), interpolation=cv2.INTER_LINEAR)

        # 2. Normalize to [0.0, 1.0] and format to (1, 3, 80, 80) float32
        tensor_input = resized.astype(np.float32) / 255.0
        tensor_input = np.transpose(tensor_input, (2, 0, 1))  # HWC -> CHW
        tensor_input = np.expand_dims(tensor_input, axis=0)   # 1, C, H, W

        # 3. ONNX Inference
        input_name = self._fas_session.get_inputs()[0].name
        outputs = self._fas_session.run(None, {input_name: tensor_input})
        logits = outputs[0][0]

        # 4. Softmax over [live, print, replay]
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)

        p_live = float(probs[0])
        p_print = float(probs[1])
        p_replay = float(probs[2])

        # Security evaluation:
        # MiniFASNet v2: live threshold typically 0.55 - 0.65
        spoof_detected = False
        attack_type = "none"

        if p_live >= 0.60:
            status = "passed"
        elif p_print >= 0.40 or p_replay >= 0.40:
            status = "failed"
            spoof_detected = True
            attack_type = "print_attack" if p_print >= p_replay else "screen_replay"
        else:
            status = "uncertain"

        return {
            "status": status,
            "live_confidence": round(p_live, 4),
            "spoof_detected": spoof_detected,
            "attack_type": attack_type,
            "probabilities": {
                "live": round(p_live, 4),
                "print_attack": round(p_print, 4),
                "screen_replay": round(p_replay, 4),
            },
        }

    def evaluate_emotion(
        self, img_bgr: np.ndarray, bbox: Tuple[int, int, int, int]
    ) -> Dict[str, Any]:
        """
        Runs SEARO1/FER_model Swin Transformer on 224x224 RGB face crop.
        Returns:
            - dominant_emotion: str
            - confidence: float
            - all_emotions: Dict[str, float]
            - affective_state: str
            - empathy_guidance: str
            - avatar_mood: str
            - stress_vulnerability_index: float (0.0 to 100.0)
        """
        if not self._ensure_models() or self._fer_model is None:
            return {
                "dominant_emotion": "neutral",
                "confidence": 0.5,
                "all_emotions": {k: 0.14 for k in EMOTION_LABELS},
                "affective_state": "steady_calm",
                "empathy_guidance": "Provide warm, mindful companion presence.",
                "avatar_mood": "neutral",
                "stress_vulnerability_index": 20.0,
                "error": self._load_error or "FER model not initialized",
            }

        # 1. 1.15x slight margin crop for FER
        crop = self.crop_face_scaled(img_bgr, bbox, scale=1.15)
        crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)

        # 2. Resize to 224x224
        pil_img = Image.fromarray(crop_rgb).resize((224, 224), Image.Resampling.BILINEAR)

        # 3. ImageNet normalization
        arr = np.array(pil_img, dtype=np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        arr = (arr - mean) / std

        tensor_input = torch.from_numpy(np.transpose(arr, (2, 0, 1))).unsqueeze(0).float()

        # 4. PyTorch forward pass
        with torch.no_grad():
            logits = self._fer_model(tensor_input)
            probs = torch.softmax(logits, dim=1).numpy()[0]

        all_emotions = {EMOTION_LABELS[i]: round(float(probs[i]), 4) for i in range(len(EMOTION_LABELS))}
        dominant_idx = int(np.argmax(probs))
        dominant_emotion = EMOTION_LABELS[dominant_idx]
        confidence = float(probs[dominant_idx])

        # Negative emotions for mental wellness stress vulnerability (sad, fear, angry, disgust)
        negative_score = all_emotions.get("sad", 0) + all_emotions.get("fear", 0) + all_emotions.get("angry", 0) + all_emotions.get("disgust", 0)
        stress_index = round(min(100.0, max(0.0, negative_score * 100)), 1)

        affective_info = AFFECTIVE_MAPPINGS.get(
            dominant_emotion,
            {
                "affective_state": "steady_calm",
                "description": "Balanced emotional state",
                "empathy_guidance": "Maintain attentive listening.",
                "avatar_mood": "neutral",
            },
        )

        return {
            "dominant_emotion": dominant_emotion,
            "confidence": round(confidence, 4),
            "all_emotions": all_emotions,
            "affective_state": affective_info["affective_state"],
            "description": affective_info["description"],
            "empathy_guidance": affective_info["empathy_guidance"],
            "avatar_mood": affective_info["avatar_mood"],
            "stress_vulnerability_index": stress_index,
        }

    async def analyze_face_frame(
        self, image_base64: str, user_consent: bool = True
    ) -> Dict[str, Any]:
        """
        Main Dual-Model Pipeline:
        1. Validates consent & decodes single frame.
        2. Detects face.
        3. Checks liveness FIRST (MiniFASNet v2).
        4. If spoofing detected, halts clinical emotion processing.
        5. If liveness passes/uncertain, predicts emotion (SEARO1/FER_model Swin Transformer).
        6. Keeps emotion & liveness strictly distinct from legal identity verification.
        """
        if not user_consent:
            return {
                "success": False,
                "error": "consent_required",
                "message": "Explicit user consent is required before analyzing camera frames.",
                "face_detected": False,
            }

        try:
            img_bgr = self.decode_base64_image(image_base64)
        except Exception as e:
            logger.warning(f"Failed to decode image frame: {e}")
            return {
                "success": False,
                "error": "invalid_image",
                "message": "Provided image data could not be parsed as a valid frame.",
                "face_detected": False,
            }

        bbox, face_count = self.detect_primary_face(img_bgr)
        if bbox is None:
            return {
                "success": True,
                "face_detected": False,
                "face_count": 0,
                "message": "No face detected in the frame. Please look directly at the camera with clear lighting.",
                "liveness": {
                    "status": "no_face",
                    "live_confidence": 0.0,
                    "spoof_detected": False,
                    "attack_type": "none",
                },
                "emotion": None,
                "security_notice": "Identity verification is strictly separate from emotion perception. No biometric data is retained.",
            }

        # ---------------------------------------------------------------------
        # STEP 1: Liveness & Anti-Spoofing Check (MUST RUN FIRST)
        # ---------------------------------------------------------------------
        liveness_result = self.evaluate_liveness(img_bgr, bbox)

        # If spoofing attack is detected (printed photo or screen replay),
        # flag immediately and block clinical emotion processing (Requirement 3).
        if liveness_result.get("spoof_detected"):
            logger.warning(
                f"Face liveness check failed: spoof attack detected ({liveness_result.get('attack_type')})"
            )
            return {
                "success": True,
                "face_detected": True,
                "face_count": face_count,
                "bbox": {"x": bbox[0], "y": bbox[1], "w": bbox[2], "h": bbox[3]},
                "liveness": liveness_result,
                "emotion": None,
                "security_alert": "Anti-spoofing triggered: Presentation attack detected (printed photo or screen replay). Clinical emotion processing halted.",
                "empathy_guidance": "Please present a live facial presence to proceed with personal wellness reflection.",
                "security_notice": "Liveness verification is an anti-spoofing defense only and does not constitute identity verification.",
            }

        # ---------------------------------------------------------------------
        # STEP 2: Facial Emotion Recognition (Swin Transformer)
        # ---------------------------------------------------------------------
        emotion_result = self.evaluate_emotion(img_bgr, bbox)

        return {
            "success": True,
            "face_detected": True,
            "face_count": face_count,
            "bbox": {"x": bbox[0], "y": bbox[1], "w": bbox[2], "h": bbox[3]},
            "liveness": liveness_result,
            "emotion": emotion_result,
            "empathy_guidance": emotion_result.get("empathy_guidance"),
            "avatar_mood": emotion_result.get("avatar_mood", "neutral"),
            "security_notice": "Non-biometric wellness estimation. Not a psychiatric diagnosis or legal identity proof.",
        }


face_analysis_service = FaceAnalysisService()
