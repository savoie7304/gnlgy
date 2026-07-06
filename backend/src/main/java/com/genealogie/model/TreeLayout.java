package com.genealogie.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TreeLayout {
    private Map<String, LayoutPosition> positions;
    private List<LayoutEdge> edges;
    private double minX, minY, maxX, maxY;
    private String rootId;

    public TreeLayout() {
        this.positions = new HashMap<>();
        this.edges = new ArrayList<>();
    }

    public Map<String, LayoutPosition> getPositions() { return positions; }
    public void setPositions(Map<String, LayoutPosition> positions) { this.positions = positions; }
    public List<LayoutEdge> getEdges() { return edges; }
    public void setEdges(List<LayoutEdge> edges) { this.edges = edges; }
    public double getMinX() { return minX; }
    public void setMinX(double minX) { this.minX = minX; }
    public double getMinY() { return minY; }
    public void setMinY(double minY) { this.minY = minY; }
    public double getMaxX() { return maxX; }
    public void setMaxX(double maxX) { this.maxX = maxX; }
    public double getMaxY() { return maxY; }
    public void setMaxY(double maxY) { this.maxY = maxY; }
    public String getRootId() { return rootId; }
    public void setRootId(String rootId) { this.rootId = rootId; }

    public double getWidth() { return maxX - minX; }
    public double getHeight() { return maxY - minY; }

    public static TreeLayout empty(String rootId) {
        TreeLayout l = new TreeLayout();
        l.rootId = rootId;
        l.minX = 0; l.minY = 0; l.maxX = 800; l.maxY = 600;
        return l;
    }
}
