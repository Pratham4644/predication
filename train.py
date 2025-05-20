from ultralytics import YOLO

# Load the YOLOv8 model
model = YOLO('yolov8n.pt')

# Train the model
model.train(data='traffic.yaml', epochs=50 ,imgsz=640)