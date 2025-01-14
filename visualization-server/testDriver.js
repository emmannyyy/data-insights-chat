const axios = require('axios');

async function testGenerateChart() {
    const url = "http://127.0.0.1:8000/generate_chart";

    // Prepare data for testing
    const requestData = {
        data: {
            "Exams": 5,
            "Assignments": 3,
            "Projects": 2
        },
        chart_type: "bar" // Change to "pie" for pie chart
    };

    try {
        const response = await axios.post(url, requestData);
    } catch (error) {
        console.error("Error generating chart:", error.response ? error.response.data : error.message);
    }
}

testGenerateChart();
