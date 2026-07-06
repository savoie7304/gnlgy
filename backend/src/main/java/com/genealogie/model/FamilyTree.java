package com.genealogie.model;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class FamilyTree {
    public static final double NODE_W = 180;
    public static final double NODE_H = 90;

    private String id;
    private String name;
    private Map<String, Person> people;
    private Map<String, Family> families;
    private Map<String, LayoutPosition> personPositions;
    private String createdAt;
    private String updatedAt;

    public FamilyTree() {
        this.people = new LinkedHashMap<>();
        this.families = new LinkedHashMap<>();
        this.personPositions = new LinkedHashMap<>();
    }

    public FamilyTree(String id, String name) {
        this.id = id;
        this.name = name;
        this.people = new LinkedHashMap<>();
        this.families = new LinkedHashMap<>();
        this.personPositions = new LinkedHashMap<>();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Map<String, Person> getPeople() { return people; }
    public void setPeople(Map<String, Person> people) { this.people = people; }
    public Map<String, Family> getFamilies() { return families; }
    public void setFamilies(Map<String, Family> families) { this.families = families; }
    public Map<String, LayoutPosition> getPersonPositions() { return personPositions; }
    public void setPersonPositions(Map<String, LayoutPosition> personPositions) { this.personPositions = personPositions; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public void touch() {
        this.updatedAt = java.time.LocalDateTime.now().toString();
    }

    public Person getPerson(String personId) {
        return people.get(personId);
    }

    public Family getFamily(String familyId) {
        return families.get(familyId);
    }

    public String findFirstPersonId() {
        return people.isEmpty() ? null : people.keySet().iterator().next();
    }

    public List<Family> getPersonFamilies(String personId) {
        return families.values().stream()
                .filter(f -> f.hasParent(personId))
                .toList();
    }

    public Family getPersonParentFamily(String personId) {
        return families.values().stream()
                .filter(f -> f.hasChild(personId))
                .findFirst()
                .orElse(null);
    }

    public List<Person> getPersonChildren(String personId) {
        return families.values().stream()
                .filter(f -> f.hasParent(personId))
                .flatMap(f -> f.getChildrenIds().stream())
                .map(people::get)
                .filter(Objects::nonNull)
                .toList();
    }

    public List<Person> getPersonSiblings(String personId) {
        Family parentFamily = getPersonParentFamily(personId);
        if (parentFamily == null) return List.of();
        return parentFamily.getChildrenIds().stream()
                .filter(id -> !id.equals(personId))
                .map(people::get)
                .filter(Objects::nonNull)
                .toList();
    }

    public List<Person> getPersonPartners(String personId) {
        return families.values().stream()
                .filter(f -> f.hasParent(personId))
                .map(f -> {
                    if (Objects.equals(f.getParent1Id(), personId)) return f.getParent2Id();
                    return f.getParent1Id();
                })
                .filter(Objects::nonNull)
                .map(people::get)
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FamilyTree that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
