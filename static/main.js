import { initializeWhiteboard } from './whiteboard.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('board');
    const clearButton = document.getElementById('clear');
    const undoButton = document.getElementById('undo');
    const redoButton = document.getElementById('redo');
    const eraserButton = document.getElementById('eraser');
    const colorButtons = document.querySelectorAll('#white, #black, #red, #green, #blue');
    const messageHistory = document.getElementById('message-history');
    const messageTemplate = document.getElementById('message-template').content;
    const input = document.getElementById('input');
    const send = document.getElementById('send');
    const messageForm = document.getElementById('message-form');
    const imageButton = document.getElementById('image');
    const imageUploadPopup = document.getElementById('image-upload-popup');
    let history = null;

    initializeWhiteboard(canvas, clearButton, undoButton, redoButton, eraserButton, colorButtons, imageButton, imageUploadPopup);

    function addMessage(content, isUser, imageSrc = null) {
        const messageElement = messageTemplate.cloneNode(true);
        const messageTitle = messageElement.querySelector('.message-title');
        const messageContent = messageElement.querySelector('.message-content');

        messageTitle.textContent = isUser ? 'User' : 'FreeMath';
        messageContent.innerHTML = marked.parse(content);
        MathJax.typeset([messageContent]);

        messageHistory.appendChild(messageElement);

        // Scroll to bottom
        messageHistory.scrollTop = messageHistory.scrollHeight;
    }

    function setMessagesDisabled(disabled) {
        messageForm.disabled = disabled;
        input.disabled = disabled;
        send.disabled = disabled;
    }

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const question = input.value;
        const image = canvas.toDataURL('image/png').split(',')[1];
        addMessage(question, true, canvas.toDataURL('image/png'));

        setMessagesDisabled(true);

        fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image,
                question,
                history,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                addMessage(data.response, false);
                history = data.history;
                setMessagesDisabled(false);
                input.value = '';
            });
    });
});