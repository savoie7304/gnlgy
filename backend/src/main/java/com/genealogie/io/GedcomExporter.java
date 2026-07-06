package com.genealogie.io;

import com.genealogie.model.*;

import java.time.LocalDate;
import java.util.*;

public class GedcomExporter {

    public String export(FamilyTree tree) {
        StringBuilder sb = new StringBuilder();

        // Header
        sb.append("0 HEAD\n");
        sb.append("1 GEDC\n");
        sb.append("2 VERS 5.5\n");
        sb.append("2 FORM LINEAGE-LINKED\n");
        sb.append("1 CHAR UTF-8\n");
        sb.append("1 SOUR GENEALOGIE_APP\n");
        sb.append("2 NAME Genealogie Java\n");
        sb.append("1 DATE ").append(formatDate(LocalDate.now().toString())).append("\n");
        sb.append("1 FILE ").append(escapeGedcomValue(tree.getName())).append(".ged\n");

        // People
        for (Person person : tree.getPeople().values()) {
            sb.append("0 ").append(person.getId()).append(" INDI\n");
            String lastName = (person.getLastName() == null || person.getLastName().isBlank()) ? "?" : person.getLastName();
            sb.append("1 NAME ").append(escapeGedcomValue(person.getFirstName()))
                    .append(" /").append(escapeGedcomValue(lastName)).append("/\n");
            sb.append("1 SEX ").append(person.getGender().getGedcomCode()).append("\n");

            if (person.getBirthDate() != null && !person.getBirthDate().isEmpty()) {
                sb.append("1 BIRT\n");
                sb.append("2 DATE ").append(formatDate(person.getBirthDate())).append("\n");
                if (person.getBirthPlace() != null && !person.getBirthPlace().isEmpty()) {
                    sb.append("2 PLAC ").append(escapeGedcomValue(person.getBirthPlace())).append("\n");
                }
            }

            if (person.getDeathDate() != null && !person.getDeathDate().isEmpty()) {
                sb.append("1 DEAT\n");
                sb.append("2 DATE ").append(formatDate(person.getDeathDate())).append("\n");
                if (person.getDeathPlace() != null && !person.getDeathPlace().isEmpty()) {
                    sb.append("2 PLAC ").append(escapeGedcomValue(person.getDeathPlace())).append("\n");
                }
            }

            // FAMS (families where this person is a parent)
            for (Family f : tree.getFamilies().values()) {
                if (f.hasParent(person.getId())) {
                    sb.append("1 FAMS ").append(f.getId()).append("\n");
                }
            }

            // FAMC (families where this person is a child)
            for (Family f : tree.getFamilies().values()) {
                if (f.hasChild(person.getId())) {
                    sb.append("1 FAMC ").append(f.getId()).append("\n");
                }
            }
        }

        // Families
        for (Family family : tree.getFamilies().values()) {
            sb.append("0 ").append(family.getId()).append(" FAM\n");
            if (family.getParent1Id() != null) {
                sb.append("1 HUSB ").append(family.getParent1Id()).append("\n");
            }
            if (family.getParent2Id() != null) {
                sb.append("1 WIFE ").append(family.getParent2Id()).append("\n");
            }
            for (String childId : family.getChildrenIds()) {
                sb.append("1 CHIL ").append(childId).append("\n");
            }
            if (family.getMarriageDate() != null && !family.getMarriageDate().isEmpty()) {
                sb.append("1 MARR\n");
                sb.append("2 DATE ").append(formatDate(family.getMarriageDate())).append("\n");
            }
            if (family.getDivorceDate() != null && !family.getDivorceDate().isEmpty()) {
                sb.append("1 DIV\n");
                sb.append("2 DATE ").append(formatDate(family.getDivorceDate())).append("\n");
            }
        }

        sb.append("0 TRLR\n");
        return sb.toString();
    }

    private String formatDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return "";
        try {
            LocalDate d = LocalDate.parse(dateStr);
            String[] months = {"JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"};
            return d.getDayOfMonth() + " " + months[d.getMonthValue() - 1] + " " + d.getYear();
        } catch (Exception e) {
            return dateStr;
        }
    }

    private String escapeGedcomValue(String value) {
        if (value == null) return "";
        return value.replace("\n", "\n1 CONT ");
    }
}
