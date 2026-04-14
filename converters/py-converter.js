/**
 * PyConverter - converts files to markdown using markitdown in Pyodide
 */
export class PyConverter {
    /**
     * Converts the file at the given path to markdown using the provided Pyodide instance.
     * @param {PyodideInterface} pyodide - The Pyodide instance.
     * @param {string} filePath - The path to the file in the Pyodide virtual filesystem.
     * @returns {Promise<string>} The converted markdown text.
     */
    async convert(pyodide, filePath) {
        try {
            // Set the filePath variable in Pyodide globals to avoid manual escaping issues
            pyodide.globals.set('filePath', filePath);

            const pythonCode = `
from markitdown import MarkItDown
md = MarkItDown()
result = md.convert(filePath)
result.markdown
            `;

            const markdown = pyodide.runPython(pythonCode);
            return markdown;
        } catch (error) {
            console.error('Conversion error in PyConverter:', error);
            throw error;
        }
    }
}
