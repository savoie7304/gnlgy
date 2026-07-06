package com.genealogie.model;

public class LayoutPosition {
    private double x;
    private double y;

    public LayoutPosition() {}

    public LayoutPosition(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public double getX() { return x; }
    public void setX(double x) { this.x = x; }
    public double getY() { return y; }
    public void setY(double y) { this.y = y; }

    public LayoutPosition copy() {
        return new LayoutPosition(x, y);
    }
}
