from ultralytics import YOLO
import numpy as np

# Load the model
model = YOLO("yolov8n.pt")

# Run detection
results1 = model("126434-735976920_small.mp4")
results2 = model("1900-151662242_tiny.mp4")

# Function to count traffic vehicles
def count_vehicles(results):
    vehicle_classes = [2, 3, 5, 7]  # Car, motorcycle, bus, truck
    vehicle_counts = []
    for r in results:
        count = sum(1 for cls in r.boxes.cls if int(cls) in vehicle_classes)
        vehicle_counts.append(count)
    return vehicle_counts

# Count for each video
counts1 = count_vehicles(results1)
counts2 = count_vehicles(results2)

# Average traffic level
avg1 = np.mean(counts1)
avg2 = np.mean(counts2)

# Print comparison
print(f"Video 1 average traffic: {avg1:.2f} vehicles/frame")
print(f"Video 2 average traffic: {avg2:.2f} vehicles/frame")

if avg1 > avg2:
    print("🚦 Higher traffic in Video 1")
    print("✅ Lower traffic in Video 2")
elif avg2 > avg1:
    print("🚦 Higher traffic in Video 2")
    print("✅ Lower traffic in Video 1")
else:
    print("⚖️ Traffic levels are similar in both videos")
