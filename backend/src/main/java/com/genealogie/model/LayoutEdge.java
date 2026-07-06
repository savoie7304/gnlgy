package com.genealogie.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class LayoutEdge {
    private String from;
    private String to;
    private String type;
    private String familyId;
    private boolean dashed;

    public LayoutEdge() {}

    public LayoutEdge(String from, String to, String type) {
        this.from = from;
        this.to = to;
        this.type = type;
    }

    public LayoutEdge(String from, String to, String type, String familyId, boolean dashed) {
        this.from = from;
        this.to = to;
        this.type = type;
        this.familyId = familyId;
        this.dashed = dashed;
    }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getFamilyId() { return familyId; }
    public void setFamilyId(String familyId) { this.familyId = familyId; }
    public boolean isDashed() { return dashed; }
    public void setDashed(boolean dashed) { this.dashed = dashed; }
}
