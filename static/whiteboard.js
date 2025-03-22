import 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js'

const background = "#28282a";
const pen_colors = {
    red: "#f12259",
    green: "#27dc66",
    blue: "#529bef"
};

export function initializeWhiteboard(canvas, clearButton, undoButton, redoButton, eraserButton, colorButtons, imageButton, imageUploadPopup) {
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let erasing = false;
    let currentColor = 'white';
    let paths = [];
    let undonePaths = [];

    // Image states
    let addingImage = false;
    let placementMode = false;
    let placementItem = null; // Holds the image or text data during placement
    let placementX = 0;
    let placementY = 0;
    let placementScale = 1;

    function adjustCanvasSize() {
        const computedStyle = getComputedStyle(canvas);
        canvas.width = parseInt(computedStyle.width);
        canvas.height = parseInt(computedStyle.height);
        clearCanvas();
    }

    adjustCanvasSize();

    function startDrawing(e) {
        if (placementMode) return;
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    }

    function draw(e) {
        if (!drawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = erasing ? background : currentColor;
        ctx.lineWidth = erasing ? 10 : 2;
        ctx.stroke();
    }

    function stopDrawing() {
        if (!drawing) return;
        drawing = false;
        ctx.closePath();
        paths.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        undonePaths = [];
    }

    function clearCanvas(clearPaths = true) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (clearPaths) {
            paths = [];
            undonePaths = [];
        }
    }

    function undo() {
        if (paths.length > 0) {
            undonePaths.push(paths.pop());
            if (paths[paths.length - 1]) {
                ctx.putImageData(paths[paths.length - 1], 0, 0);
            } else {
                clearCanvas(false);
            }
        }
    }

    function redo() {
        if (undonePaths.length > 0) {
            paths.push(undonePaths.pop());
            ctx.putImageData(paths[paths.length - 1], 0, 0);
        }
    }

    function selectColor(e) {
        let button = e.target;
        while (button.tagName !== 'BUTTON') {
            button = button.parentElement;
        }
        erasing = false;
        currentColor = pen_colors[button.id] || button.id;
        colorButtons.forEach(button => button.classList.remove('selected'));
        eraserButton.classList.remove('selected');
        button.classList.add('selected');
    }

    function selectEraser() {
        erasing = true;
        colorButtons.forEach(button => button.classList.remove('selected'));
        eraserButton.classList.add('selected');
    }

    function handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                placementItem = {type: 'image', data: img};
                placementMode = true;
                placementX = canvas.width / 2 - img.width / 2;
                placementY = canvas.height / 2 - img.height / 2;
                placementScale = 1;
                imageUploadPopup.style.display = 'none';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    imageButton.addEventListener('click', () => {
        addingImage = true;
        imageUploadPopup.style.display = 'block';
    });

    const imageInput = imageUploadPopup.querySelector('#image-upload');
    const imageDropArea = imageUploadPopup.querySelector('#image-drop-area');

    imageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
        }
    });

    imageDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageDropArea.classList.add('dragover');
    });

    imageDropArea.addEventListener('dragleave', () => {
        imageDropArea.classList.remove('dragover');
    });

    imageDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageDropArea.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });

    imageUploadPopup.querySelector('.close-popup').addEventListener('click', () => {
        imageUploadPopup.style.display = 'none';
        addingImage = false;
    });

    imageUploadPopup.querySelector('#confirm-image').addEventListener('click', () => {
        if (imageInput.files && imageInput.files[0]) {
            handleImageUpload(imageInput.files[0]);
        }
    });

    function drawPlacementItem() {
        if (!placementMode || !placementItem) return;
        ctx.save();
        ctx.globalAlpha = 0.7; // Slightly transparent
        const imgWidth = placementItem.data.width * placementScale;
        const imgHeight = placementItem.data.height * placementScale;
        ctx.drawImage(placementItem.data, placementX - imgWidth / 2, placementY - imgHeight / 2, imgWidth, imgHeight); // Center the image
        ctx.restore();
    }

    canvas.addEventListener('mousemove', (e) => {
        if (placementMode) {
            placementX = e.offsetX;
            placementY = e.offsetY;
            clearCanvas(false);
            if (paths.length > 0) {
                ctx.putImageData(paths[paths.length - 1], 0, 0);
            }
            drawPlacementItem();
        }
    });

    canvas.addEventListener('wheel', (e) => {
        if (placementMode) {
            e.preventDefault();
            placementScale += e.deltaY * -0.001;
            placementScale = Math.max(0.1, placementScale); // Prevent negative or too small scale
            clearCanvas(false);
            if (paths.length > 0) {
                ctx.putImageData(paths[paths.length - 1], 0, 0);
            }
            drawPlacementItem();
        }
    });


    canvas.addEventListener('click', (e) => {
        if (placementMode && placementItem) {
            ctx.save();
            const imgWidth = placementItem.data.width * placementScale;
            const imgHeight = placementItem.data.height * placementScale;
            ctx.drawImage(placementItem.data, placementX - imgWidth / 2, placementY - imgHeight / 2, imgWidth, imgHeight); // Center the image
            ctx.restore();
            paths.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            undonePaths = [];
            placementMode = false;
            placementItem = null;
        }
    });


    adjustCanvasSize();
    window.addEventListener('resize', adjustCanvasSize);
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    clearButton.addEventListener('click', clearCanvas);
    undoButton.addEventListener('click', undo);
    redoButton.addEventListener('click', redo);
    eraserButton.addEventListener('click', selectEraser);
    colorButtons.forEach(button => button.addEventListener('click', selectColor));

    clearCanvas();
}