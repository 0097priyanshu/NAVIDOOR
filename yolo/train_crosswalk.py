import os
import shutil
from pathlib import Path
from ultralytics import YOLO

def main():
    base_dir = Path(r"C:\Users\Aadya\NAVIDOOR\yolo")
    model_path = base_dir / "models" / "yolo11n.pt"
    data_yaml = base_dir / "dataset" / "crosswalk" / "data.yaml"
    dest_model = base_dir / "models" / "yolo11n_crosswalk.pt"
    
    print(f"Loading pretrained base model: {model_path}...")
    model = YOLO(str(model_path))
    
    print(f"Starting training on {data_yaml}...")
    results = model.train(
        data=str(data_yaml),
        epochs=20,
        imgsz=640,
        batch=16,
        device="cpu",
        workers=2,
        project=str(base_dir / "runs"),
        name="crosswalk_yolo11",
        exist_ok=True,
        verbose=True
    )
    
    # Save best weights
    best_weights = base_dir / "runs" / "crosswalk_yolo11" / "weights" / "best.pt"
    if best_weights.exists():
        shutil.copy2(best_weights, dest_model)
        print(f"\nSuccessfully saved fine-tuned model to: {dest_model}")
    else:
        last_weights = base_dir / "runs" / "crosswalk_yolo11" / "weights" / "last.pt"
        if last_weights.exists():
            shutil.copy2(last_weights, dest_model)
            print(f"\nSaved last model weights to: {dest_model}")
        else:
            print(f"\nWarning: could not find trained weights at {best_weights}")
            
    # Validate on test set
    if dest_model.exists():
        print(f"\nEvaluating fine-tuned model on test set...")
        eval_model = YOLO(str(dest_model))
        metrics = eval_model.val(
            data=str(data_yaml),
            split="test",
            project=str(base_dir / "runs"),
            name="crosswalk_test_val",
            exist_ok=True
        )
        print(f"Test mAP50: {metrics.box.map50:.4f}")
        print(f"Test mAP50-95: {metrics.box.map:.4f}")

if __name__ == "__main__":
    main()

