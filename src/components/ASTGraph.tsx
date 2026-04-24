import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { ASTNode } from "@/lib/parserTypes";
import { convertASTToGraph } from "@/lib/astToGraph";

type Props = {
  ast: ASTNode | null;
};

export default function ASTGraph({ ast }: Props) {
  if (!ast) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-4 text-sm text-muted-foreground italic">
        No AST available for graph visualization.
      </div>
    );
  }

  const { nodes, edges } = convertASTToGraph(ast);

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="px-5 py-3 border-b bg-muted/50 rounded-t-lg">
        <span className="text-sm font-medium text-muted-foreground">
          AST Graph — {nodes.length} nodes
        </span>
      </div>
      <div style={{ height: 450 }} className="rounded-b-lg overflow-hidden">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
