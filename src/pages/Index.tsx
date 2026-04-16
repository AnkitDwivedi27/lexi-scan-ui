import { useState } from "react";
import { runLexer, Token, SymbolEntry } from "@/lib/lexer";
import { Play, Trash2, Download, Terminal, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DFAVisualization from "@/components/DFAVisualization";

const SAMPLE_CODE = `int main() {
  var x = 10;
  float y = 3.14;
  string name = "hello";
  if (x > 5) {
    print(y);
  }
  return 0;
}`;

const Index = () => {
  const [source, setSource] = useState(SAMPLE_CODE);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [symbolTable, setSymbolTable] = useState<SymbolEntry[]>([]);
  const [outputText, setOutputText] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleRun = () => {
    const result = runLexer(source);
    setTokens(result.tokens);
    setSymbolTable(result.symbolTable);
    setOutputText(result.outputText);
    setCompleted(true);
  };

  const handleClear = () => {
    setSource("");
    setTokens([]);
    setSymbolTable([]);
    setOutputText("");
    setCompleted(false);
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "OutputFile.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tokenTypeColor = (type: string) => {
    switch (type) {
      case "KEYWORD": return "text-primary font-semibold";
      case "IDENTIFIER": return "text-accent-foreground";
      case "INT_LITERAL":
      case "FLOAT_LITERAL": return "text-success";
      case "STRING_LITERAL": return "text-orange-600";
      case "OPERATOR": return "text-muted-foreground";
      case "DELIMITER": return "text-muted-foreground";
      case "ERROR": return "text-destructive font-semibold";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary py-5 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Terminal className="h-7 w-7 text-primary-foreground" />
          <h1 className="text-2xl font-bold text-primary-foreground tracking-tight font-mono">
            DFA Based Lexical Analyzer
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Input Section */}
        <section className="bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/50 rounded-t-lg">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Source Code Input</span>
            <span className="text-xs text-muted-foreground ml-auto font-mono">SourceFile.txt</span>
          </div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full h-64 p-4 font-mono text-sm bg-card text-card-foreground resize-none focus:outline-none rounded-b-lg"
            placeholder="Enter your source code here..."
            spellCheck={false}
          />
        </section>

        {/* Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleRun} size="lg" className="gap-2">
            <Play className="h-4 w-4" />
            Run Lexical Analysis
          </Button>
          <Button onClick={handleClear} variant="outline" size="lg" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
          {outputText && (
            <Button onClick={handleDownload} variant="secondary" size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Download OutputFile.txt
            </Button>
          )}
          {completed && (
            <span className="flex items-center gap-1.5 text-sm text-success font-medium ml-auto">
              <CheckCircle2 className="h-4 w-4" />
              Lexical Analysis Completed
            </span>
          )}
        </div>

        {/* Results */}
        {tokens.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Token Table */}
            <div className="lg:col-span-2 bg-card rounded-lg border shadow-sm">
              <div className="px-5 py-3 border-b bg-muted/50 rounded-t-lg">
                <span className="text-sm font-medium text-muted-foreground">
                  Token Stream — {tokens.length} tokens
                </span>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm font-mono">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium">#</th>
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium">Token Type</th>
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium">Lexeme</th>
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((t, i) => (
                      <tr key={i} className={`border-t ${t.isError ? "bg-destructive/5" : "hover:bg-muted/30"}`}>
                        <td className="px-4 py-1.5 text-muted-foreground">{i + 1}</td>
                        <td className={`px-4 py-1.5 ${tokenTypeColor(t.type)}`}>{t.type}</td>
                        <td className="px-4 py-1.5">{t.lexeme}</td>
                        <td className="px-4 py-1.5 text-muted-foreground">{t.line}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Symbol Table */}
            <div className="bg-card rounded-lg border shadow-sm">
              <div className="px-5 py-3 border-b bg-muted/50 rounded-t-lg">
                <span className="text-sm font-medium text-muted-foreground">
                  Symbol Table — {symbolTable.length} entries
                </span>
              </div>
              <div className="max-h-96 overflow-auto">
                {symbolTable.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground italic">No identifiers found.</p>
                ) : (
                  <table className="w-full text-sm font-mono">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-muted-foreground font-medium">Identifier</th>
                        <th className="text-left px-4 py-2 text-muted-foreground font-medium">Pointer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {symbolTable.map((s, i) => (
                        <tr key={i} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-1.5 text-accent-foreground">{s.identifier}</td>
                          <td className="px-4 py-1.5 text-muted-foreground">{s.pointer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
