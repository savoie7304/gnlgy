package com.genealogie.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Gender {
    MALE, FEMALE, OTHER;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static Gender fromJson(String value) {
        if (value == null) return OTHER;
        return switch (value.toLowerCase()) {
            case "male" -> MALE;
            case "female" -> FEMALE;
            default -> OTHER;
        };
    }

    public String getDisplayName() {
        return switch (this) {
            case MALE -> "Homme";
            case FEMALE -> "Femme";
            case OTHER -> "Autre";
        };
    }

    public char getGedcomCode() {
        return switch (this) {
            case MALE -> 'M';
            case FEMALE -> 'F';
            case OTHER -> 'U';
        };
    }

    public static Gender fromGedcomCode(String code) {
        if (code == null) return OTHER;
        return switch (code.toUpperCase()) {
            case "M" -> MALE;
            case "F" -> FEMALE;
            default -> OTHER;
        };
    }
}
