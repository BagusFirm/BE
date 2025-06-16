#!/usr/bin/env python3
import sys
import json
import os
import warnings
import joblib

def load_model_and_encoder():
    here = os.path.dirname(__file__)
    model_path = os.path.normpath(os.path.join(here, '../../parenting_match_model.pkl'))
    encoder_path = os.path.normpath(os.path.join(here, '../../label_parenting_match_model.pkl'))

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = joblib.load(model_path)
        label_encoder = joblib.load(encoder_path)

    print(f"✅ Loaded model: {type(model)}", file=sys.stderr)
    print(f"✅ Loaded encoder: {type(label_encoder)}", file=sys.stderr)
    return model, label_encoder

def main():
    try:
        input_str = sys.argv[1]
        data = json.loads(input_str)

        scores = data.get("scores", [])
        if not isinstance(scores, list) or len(scores) != 10:
            raise ValueError("Expected 10 scores as a list")

        model, label_encoder = load_model_and_encoder()
        print("✅ Input scores:", scores, file=sys.stderr)

        prediction_raw = model.predict([scores])[0]
        print("✅ Raw prediction (encoded):", prediction_raw, file=sys.stderr)

        # Konversi prediksi ke label asli
        prediction = label_encoder.inverse_transform([prediction_raw])[0]
        print("✅ Final prediction (label):", prediction, file=sys.stderr)

        output = {
            "message": "Prediction ok",
            "score": scores,
            "label": prediction,
            "result": {
                "parentingStyle": prediction,
                "description": "Deskripsi gaya parenting.",
                "recommendations": [],
                "tips": []
            }
        }

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({
            "message": "Prediction failed",
            "error": str(e)
        }))

if __name__ == "__main__":
    main()
