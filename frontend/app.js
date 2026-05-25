async function upload() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image first");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("http://127.0.0.1:8000/api/process", {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        const resultImg = document.getElementById("result");

        // CASE 1: URL response (best practice)
        if (data.image_url) {
            resultImg.src = data.image_url;
        }

        // CASE 2: Base64 response
        else if (data.image) {
            resultImg.src = `data:image/jpeg;base64,${data.image}`;
        }

        // CASE 3: nothing returned
        else {
            console.log("Unexpected response:", data);
            alert("Backend did not return an image");
        }

    } catch (error) {
        console.error("Upload failed:", error);
        alert("Error connecting to backend");
    }
}