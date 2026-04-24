import { Node, Edge } from "reactflow";
import { ASTNode } from "./parserTypes";

export function convertASTToGraph(ast: ASTNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let idCounter = 0;
  let xCounter = 0;

  function traverse(node: ASTNode, parentId?: string, depth = 0) {
    const id = `node_${idCounter++}`;
    nodes.push({
      id,
      data: {
        label: node.value ? `${node.type}: ${node.value}` : node.type,
      },
      position: { x: xCounter * 170, y: depth * 100 },
      style: {
        padding: 8,
        border: "1px solid hsl(var(--border))",
        borderRadius: 6,
        background: "hsl(var(--card))",
        color: "hsl(var(--card-foreground))",
        fontSize: 12,
        fontFamily: "monospace",
      },
    });

    if (parentId) {
      edges.push({
        id: `edge_${parentId}_${id}`,
        source: parentId,
        target: id,
        animated: true,
      });
    }

    xCounter++;
    node.children?.forEach((child) => traverse(child, id, depth + 1));
  }

  traverse(ast);
  return { nodes, edges };
}
