// Utility functions for Cube Dash Arena

/**
 * Updates the error log element with a message and appropriate styling
 * @param {string} message - The message to display
 * @param {'red'|'orange'|'green'} color - Color for the message (red for errors, orange for warnings, green for success)
 * @param {string} [title] - Optional title attribute for additional details (like stack trace)
 */
export function updateErrorLog(message, color = 'red', title = '') {
    const errorLog = document.getElementById('errorLog');
    if (errorLog) {
        errorLog.textContent = message;
        errorLog.style.color = color;
        
        if (title) {
            errorLog.title = title;
        }
    }
}

/**
 * Clears the error log element
 */
export function clearErrorLog() {
    const errorLog = document.getElementById('errorLog');
    if (errorLog) {
        errorLog.textContent = '';
        errorLog.style.color = '';
        errorLog.title = '';
    }
}

/**
 * Logs an error to both console and the UI error log
 * @param {string} context - Context where the error occurred
 * @param {Error} error - The error object
 */
export function logError(context, error) {
    console.error(`${context}:`, error);
    updateErrorLog(`${context}: ${error.message}`, 'red', error.stack);
}

/**
 * Logs a warning to both console and the UI error log
 * @param {string} message - Warning message
 */
export function logWarning(message) {
    console.warn(message);
    updateErrorLog(message, 'orange');
}

/**
 * Logs a success message to both console and the UI error log
 * @param {string} message - Success message
 */
export function logSuccess(message) {
    console.log(message);
    updateErrorLog(message, 'green');
}
