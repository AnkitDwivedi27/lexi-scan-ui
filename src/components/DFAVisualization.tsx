import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/* ── Custom state node ── */
function StateNode({ data }: NodeProps) {
  const isActive = data.active as boolean;
  const isAccept = data.accept as boolean;
  const label = data.label as string;

  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 font-mono text-sm transition-colors
        ${isActive
          ? "border-primary bg-primary text-primary-foreground shadow-lg"
          : "border-muted-foreground/40 bg-card text-card-foreground"
        }
        ${isAccept ? "ring-2 ring-offset-2 ring-muted-foreground/30" : ""}
      `}
      style={{ width: 52, height: 52 }}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      {label}
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

const nodeTypes = { stateNode: StateNode };

/* ── DFA definitions ── */
interface DFADef {
  label: string;
  nodes: Node[];
  edges: Edge[];
  description: string;
}

const edgeStyle = {
  stroke: "hsl(215 15% 50%)",
  strokeWidth: 1.5,
};
const activeEdgeStyle = {
  stroke: "hsl(214 80% 52%)",
  strokeWidth: 2.5,
};

const makeDFAs = (): DFADef[] => [
  {
    label: "Identifier",
    description: "Accepts letters/underscores followed by alphanumeric/underscores",
    nodes: [
      { id: "q0", type: "stateNode", position: { x: 0, y: 80 }, data: { label: "q0", active: false, accept: false } },
      { id: "q1", type: "stateNode", position: { x: 200, y: 80 }, data: { label: "q1", active: false, accept: true } },
    ],
    edges: [
      { id: "e-q0-q1", source: "q0", target: "q1", label: "[a-zA-Z_]", style: edgeStyle, markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 } },
      { id: "e-q1-q1", source: "q1", target: "q1", label: "[a-zA-Z0-9_]", style: edgeStyle, markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 } },
    ],
  },
  {
    label: "Number",
    description: "Accepts integers (q1) and floats with decimal point (q3)",
    nodes: [
      { id: "q0", type: "stateNode", position: { x: 0, y: 80 }, data: { label: "q0", active: false, accept: false } },
      { id: "q1", type: "stateNode", position: { x: 180, y: 80 }, data: { label: "q1", active: false, accept: true } },
      { id: "q2", type: "stateNode", position: { x: 360, y: 80 }, data: { label: "q2", active: false, accept: false } },
      { id: "q3", type: "stateNode", position: { x: 540, y: 80 }, data: { label: "q3", active: false, accept: true } },
    ],
    edges: [
      { id: "e-q0-q1", source: "q0", target: "q1", label: "[0-9]", style: edgeStyle, markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 } },
      { id: "e-q1-q1", source: "q1", target: "q1", label: "[0-9]", style: edgeStyle, markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 } },
      { id: "e-q1-q2", source: "q1", target: "q2", label: ".", style: edgeStyle, markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 } },
      { id: "e-q2-q3", source: "q2", target: "q3", label: "[0-9]", style: edgeStyle, markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 } },
      { id: "e-q3-q3", source: "q3", target: "q3", label: "[0-9]", style: edgeStyle, markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 } },
    ],
  },
];

/* ── Simulate DFA step-by-step ── */
function simulateIdentifierDFA(input: string): number[] {
  const states: number[] = [0];
  let state = 0;
  for (const ch of input) {
    if (state === 0 && (/[a-zA-Z]/.test(ch) || ch === "_")) { state = 1; }
    else if (state === 1 && (/[a-zA-Z0-9]/.test(ch) || ch === "_")) { state = 1; }
    else { state = -1; }
    states.push(state);
  }
  return states;
}

function simulateNumberDFA(input: string): number[] {
  const states: number[] = [0];
  let state = 0;
  for (const ch of input) {
    if (state === 0 && /\d/.test(ch)) state = 1;
    else if (state === 1 && /\d/.test(ch)) state = 1;
    else if (state === 1 && ch === ".") state = 2;
    else if (state === 2 && /\d/.test(ch)) state = 3;
    else if (state === 3 && /\d/.test(ch)) state = 3;
    else state = -1;
    states.push(state);
  }
  return states;
}

/* ── Main component ── */
export default function DFAVisualization() {
  const dfas = makeDFAs();
  const [selectedDFA, setSelectedDFA] = useState(0);
  const [testInput, setTestInput] = useState("");
  const [step, setStep] = useState(-1);
  const [stateTrace, setStateTrace] = useState<number[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState(dfas[0].nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(dfas[0].edges);

  // Reset when DFA selection changes
  useEffect(() => {
    setTestInput("");
    setStep(-1);
    setStateTrace([]);
    setNodes(dfas[selectedDFA].nodes);
    setEdges(dfas[selectedDFA].edges);
  }, [selectedDFA]);

  // Simulate
  const handleSimulate = useCallback(() => {
    if (!testInput) return;
    const trace = selectedDFA === 0
      ? simulateIdentifierDFA(testInput)
      : simulateNumberDFA(testInput);
    setStateTrace(trace);
    setStep(0);
  }, [testInput, selectedDFA]);

  const handleStep = useCallback(() => {
    if (step < testInput.length) setStep((s) => s + 1);
  }, [step, testInput]);

  const handleReset = useCallback(() => {
    setStep(-1);
    setStateTrace([]);
  }, []);

  // Highlight active state
  useEffect(() => {
    const activeState = step >= 0 && step < stateTrace.length ? stateTrace[step] : -1;
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, active: n.id === `q${activeState}` },
      }))
    );
  }, [step, stateTrace, setNodes]);

  const currentState = step >= 0 && step < stateTrace.length ? stateTrace[step] : null;
  const isRunning = step >= 0;
  const isDone = step >= testInput.length && isRunning;

  return (
    <div className="space-y-4">
      {/* DFA selector */}
      <div className="flex items-center gap-3 flex-wrap">
        {dfas.map((d, i) => (
          <button
            key={d.label}
            onClick={() => setSelectedDFA(i)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors
              ${selectedDFA === i
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-card-foreground border-border hover:bg-muted"
              }`}
          >
            {d.label} DFA
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-2">
          {dfas[selectedDFA].description}
        </span>
      </div>

      {/* Graph */}
      <div className="rounded-lg border bg-card overflow-hidden" style={{ height: 240 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
        >
          <Background gap={20} size={1} color="hsl(210 20% 90%)" />
        </ReactFlow>
      </div>

      {/* Test input */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={testInput}
          onChange={(e) => { setTestInput(e.target.value); handleReset(); }}
          placeholder={selectedDFA === 0 ? "e.g. myVar_1" : "e.g. 3.14"}
          className="px-3 py-1.5 rounded-md border bg-card text-card-foreground font-mono text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {!isRunning ? (
          <button
            onClick={handleSimulate}
            disabled={!testInput}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground disabled:opacity-40"
          >
            Simulate
          </button>
        ) : (
          <>
            <button
              onClick={handleStep}
              disabled={isDone}
              className="px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground disabled:opacity-40"
            >
              Step →
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-1.5 rounded-md text-sm font-medium border border-border bg-card text-card-foreground hover:bg-muted"
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* State trace */}
      {isRunning && (
        <div className="flex items-center gap-1 font-mono text-sm flex-wrap">
          <span className="text-muted-foreground mr-1">Trace:</span>
          {stateTrace.slice(0, step + 1).map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className={`px-1.5 py-0.5 rounded text-xs ${i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                q{s < 0 ? "✗" : s}
              </span>
              {i < step && i < testInput.length && (
                <span className="text-xs text-muted-foreground">—<span className="text-accent-foreground">{testInput[i]}</span>→</span>
              )}
            </span>
          ))}
          {isDone && (
            <span className={`ml-2 text-xs font-medium ${currentState === 1 || currentState === 3 ? "text-green-600" : "text-destructive"}`}>
              {currentState === 1 || currentState === 3 ? "✓ Accepted" : "✗ Rejected"}
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-muted-foreground/40 bg-card" /> State
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-muted-foreground/40 bg-card ring-2 ring-offset-1 ring-muted-foreground/30" /> Accept
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-primary bg-primary" /> Active
        </span>
      </div>
    </div>
  );
}
