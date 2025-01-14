from fastapi import Request, FastAPI, HTTPException
from pydantic import BaseModel
import matplotlib.pyplot as plt
import io
import base64
from wordcloud import WordCloud
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from traceback import format_exc

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = None
def load_csv():
    global df
    try:
        df = pd.read_csv("responses.csv")
        print("dataset loaded")
    except Exception as e:
        print(f"Error loading csv: {e}")

class ChartRequest(BaseModel):
    data: dict
    chart_type: str

@app.get("/")
def read_root():
    return {"message": "Server is running!"}

@app.post("/generate_chart")
def generate_chart(request: ChartRequest):
    # Generate a chart based on the chart type
    plt.figure()
    if request.chart_type == "bar":
        plt.bar(request.data.keys(), request.data.values())
    elif request.chart_type == "pie":
        plt.pie(request.data.values(), labels=request.data.keys(), autopct='%1.1f%%')
    else:
        raise HTTPException(status_code=400, detail="Unsupported chart type")
    
    # Convert the chart to Base64
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode("utf-8")
    buf.close()
    plt.close()
    return {"chart": f"data:image/png;base64,{image_base64}"}

@app.post("/generate_wordcloud")
def generate_wordcloud(text: str):
    # Generate a word cloud
    wordcloud = WordCloud(width=800, height=400, background_color="white").generate(text)
    buf = io.BytesIO()
    wordcloud.to_image().save(buf, format="PNG")
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode("utf-8")
    buf.close()
    return {"wordcloud": f"data:image/png;base64,{image_base64}"}

@app.post("/visualize")
async def visualize(request: Request):
    try:
        # Parse the incoming JSON data
        data = await request.json()
        python_code = data.get("code", "")

        # Check if the DataFrame is loaded
        if df is None:
            raise HTTPException(status_code=500, detail="Dataset not loaded")

        # Create a local context for executing the Python code
        local_context = {"df": df, "plt": plt, "io": io, "base64": base64}

        # Execute the provided Python code
        exec(python_code, {}, local_context)

        # Retrieve the generated image from the context
        image_bytes = local_context.get("output_image")
        if not image_bytes:
            raise ValueError("Python code did not generate an output image")

        # Convert the image to a Base64 string
        base64_image = base64.b64encode(image_bytes.getvalue()).decode("utf-8")
        print(base64_image)

        return {"success": True, "image": f"data:image/png;base64,{base64_image}"}
    except Exception as e:
        return {"success": False, "error": format_exc()}

if __name__ == "__main__":
    load_csv()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


