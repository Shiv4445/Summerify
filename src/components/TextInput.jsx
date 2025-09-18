function TextInput({ value, onChange, onSubmit, loading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="text-input-section">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="text-input" className="input-label">
            Enter your text to summarize
          </label>
          <textarea
            id="text-input"
            className="text-area"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your long text here... (articles, research papers, documents, etc.)"
            rows={12}
            disabled={loading}
          />
          <div className="input-footer">
            <span className="char-count">
              {value.length} characters
            </span>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !value.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="button-icon">✨</span>
                  Summarize & Generate Questions
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default TextInput;