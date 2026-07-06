package com.genealogie.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class Family {
    private String id;
    private String parent1Id;
    private String parent2Id;
    private List<String> childrenIds;
    private boolean dashed;
    private String marriageDate;
    private String divorceDate;

    public Family() {
        this.childrenIds = new ArrayList<>();
    }

    public Family(String id) {
        this.id = id;
        this.childrenIds = new ArrayList<>();
    }

    public Family(String id, String parent1Id, String parent2Id) {
        this.id = id;
        this.parent1Id = parent1Id;
        this.parent2Id = parent2Id;
        this.childrenIds = new ArrayList<>();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getParent1Id() { return parent1Id; }
    public void setParent1Id(String parent1Id) { this.parent1Id = parent1Id; }
    public String getParent2Id() { return parent2Id; }
    public void setParent2Id(String parent2Id) { this.parent2Id = parent2Id; }
    public List<String> getChildrenIds() { return childrenIds; }
    public void setChildrenIds(List<String> childrenIds) { this.childrenIds = childrenIds; }
    public boolean isDashed() { return dashed; }
    public void setDashed(boolean dashed) { this.dashed = dashed; }
    public String getMarriageDate() { return marriageDate; }
    public void setMarriageDate(String marriageDate) { this.marriageDate = marriageDate; }
    public String getDivorceDate() { return divorceDate; }
    public void setDivorceDate(String divorceDate) { this.divorceDate = divorceDate; }

    public boolean hasParent(String personId) {
        return Objects.equals(parent1Id, personId) || Objects.equals(parent2Id, personId);
    }

    public boolean hasChild(String personId) {
        return childrenIds.contains(personId);
    }

    public List<String> getParentIds() {
        List<String> parents = new ArrayList<>();
        if (parent1Id != null) parents.add(parent1Id);
        if (parent2Id != null) parents.add(parent2Id);
        return parents;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Family family)) return false;
        return Objects.equals(id, family.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
