export const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export const compressImage = (file, options = {}) =>
    new Promise((resolve, reject) => {
        const {
            maxWidth = 1440,
            maxHeight = 1440,
            quality = 0.72,
            outputType = "image/jpeg",
        } = options;

        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                let { width, height } = image;
                const scale = Math.min(maxWidth / width, maxHeight / height, 1);

                width = Math.round(width * scale);
                height = Math.round(height * scale);

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");
                context.drawImage(image, 0, 0, width, height);

                resolve(canvas.toDataURL(outputType, quality));
            };
            image.onerror = reject;
            image.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
