import requests

# URL of the FastAPI server
url = "http://127.0.0.1:8000/visualize"

# Python code to generate a visualization
python_code = """
import matplotlib.pyplot as plt
from io import BytesIO

# Example dataset for visualization
data = {'Exams': 5, 'Assignments': 3, 'Projects': 2}

# Create a bar chart
plt.figure(figsize=(8, 6))
plt.bar(data.keys(), data.values(), color='skyblue')
plt.title('Frequency of Stress Sources')
plt.xlabel('Source')
plt.ylabel('Count')

# Save the figure to BytesIO
output_image = BytesIO()
plt.savefig(output_image, format='png')
output_image.seek(0)
"""

# Send a POST request to the /visualize endpoint
response = requests.post(url, json={"code": python_code})

# Handle the response
if response.status_code == 200:
    data = response.json()
    if data.get("success"):
        # Decode and save the Base64-encoded image
        base64_image = data.get("image")
        print(base64_image)
    else:
        print("Error:", data.get("error"))
else:
    print("Failed to connect to the server. Status code:", response.status_code)
