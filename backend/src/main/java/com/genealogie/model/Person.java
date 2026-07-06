package com.genealogie.model;

import java.util.Objects;

public class Person {
    private String id;
    private String firstName;
    private String lastName;
    private Gender gender;
    private String birthDate;
    private String deathDate;
    private String birthPlace;
    private String deathPlace;
    private String photo;
    private String occupation;
    private String notes;

    public Person() {
        this.gender = Gender.OTHER;
    }

    public Person(String id, String firstName, String lastName, Gender gender) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
    public String getBirthDate() { return birthDate; }
    public void setBirthDate(String birthDate) { this.birthDate = birthDate; }
    public String getDeathDate() { return deathDate; }
    public void setDeathDate(String deathDate) { this.deathDate = deathDate; }
    public String getBirthPlace() { return birthPlace; }
    public void setBirthPlace(String birthPlace) { this.birthPlace = birthPlace; }
    public String getDeathPlace() { return deathPlace; }
    public void setDeathPlace(String deathPlace) { this.deathPlace = deathPlace; }
    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public int getBirthYear() {
        if (birthDate == null || birthDate.isEmpty()) return 0;
        try {
            String y = birthDate.length() >= 4 ? birthDate.substring(0, 4) : "";
            return Integer.parseInt(y);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    public String getFullName() {
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Person person)) return false;
        return Objects.equals(id, person.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return getFullName();
    }
}
