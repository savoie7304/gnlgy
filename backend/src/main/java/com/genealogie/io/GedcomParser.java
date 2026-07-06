package com.genealogie.io;

import com.genealogie.model.*;
import com.genealogie.store.IdGenerator;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class GedcomParser {

    public FamilyTree parse(String content) {
        List<GedcomLine> lines = parseLines(content);
        List<ParsedNode> nodes = buildTree(lines);

        FamilyTree tree = new FamilyTree(IdGenerator.generateTreeId(), "Import " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        tree.setCreatedAt(LocalDate.now().toString());
        tree.setUpdatedAt(tree.getCreatedAt());

        List<ParsedNode> indiNodes = new ArrayList<>();
        List<ParsedNode> famNodes = new ArrayList<>();

        for (ParsedNode node : nodes) {
            if ("INDI".equals(node.line.tag)) indiNodes.add(node);
            else if ("FAM".equals(node.line.tag)) famNodes.add(node);
        }

        Map<String, String> xrefToPersonId = new HashMap<>();

        for (ParsedNode indi : indiNodes) {
            String xref = indi.line.xref;
            String personId = IdGenerator.generatePersonId();
            if (xref != null) xrefToPersonId.put(xref, personId);

            Person person = new Person(personId, "", "", Gender.OTHER);

            String nameVal = getChildValue(indi, "NAME");
            if (nameVal != null) {
                String[] parsed = parseName(nameVal);
                person.setFirstName(parsed[0]);
                person.setLastName(parsed[1]);
            }

            String sex = getChildValue(indi, "SEX");
            if (sex != null) {
                person.setGender(Gender.fromGedcomCode(sex));
            }

            String birthDate = getSubChildValue(indi, "BIRT", "DATE");
            if (birthDate != null) person.setBirthDate(parseGedcomDate(birthDate));
            String birthPlace = getSubChildValue(indi, "BIRT", "PLAC");
            if (birthPlace != null) person.setBirthPlace(birthPlace);

            String deathDate = getSubChildValue(indi, "DEAT", "DATE");
            if (deathDate != null) person.setDeathDate(parseGedcomDate(deathDate));
            String deathPlace = getSubChildValue(indi, "DEAT", "PLAC");
            if (deathPlace != null) person.setDeathPlace(deathPlace);

            tree.getPeople().put(person.getId(), person);
        }

        for (ParsedNode fam : famNodes) {
            String xref = fam.line.xref;
            String familyId = IdGenerator.generateFamilyId();

            Family family = new Family(familyId);

            String husbXref = getChildValue(fam, "HUSB");
            String wifeXref = getChildValue(fam, "WIFE");

            String husbId = husbXref != null ? xrefToPersonId.get(husbXref) : null;
            String wifeId = wifeXref != null ? xrefToPersonId.get(wifeXref) : null;

            if (husbId != null) {
                family.setParent1Id(husbId);
                if (wifeId != null) family.setParent2Id(wifeId);
            } else if (wifeId != null) {
                family.setParent1Id(wifeId);
            }

            for (ParsedNode child : fam.children) {
                if ("CHIL".equals(child.line.tag)) {
                    String childXref = child.line.value;
                    String childId = xrefToPersonId.get(childXref);
                    if (childId != null) {
                        family.getChildrenIds().add(childId);
                    }
                }
            }

            String marriageDate = getSubChildValue(fam, "MARR", "DATE");
            if (marriageDate != null) family.setMarriageDate(parseGedcomDate(marriageDate));

            String divorceDate = getSubChildValue(fam, "DIV", "DATE");
            if (divorceDate != null) family.setDivorceDate(parseGedcomDate(divorceDate));

            tree.getFamilies().put(family.getId(), family);
        }

        return tree;
    }

    private List<GedcomLine> parseLines(String content) {
        List<GedcomLine> result = new ArrayList<>();
        String[] lines = content.split("\n");

        GedcomLine last = null;

        for (String raw : lines) {
            String trimmed = raw.trim();
            if (trimmed.isEmpty()) continue;

            String[] parts = trimmed.split("\\s+");
            int level;
            try {
                level = Integer.parseInt(parts[0]);
            } catch (NumberFormatException e) {
                continue;
            }

            int idx = 1;
            String xref = null;
            String tag;

            if (idx < parts.length && parts[idx].startsWith("@")) {
                xref = parts[idx];
                idx++;
            }

            if (idx >= parts.length) continue;
            tag = parts[idx];
            idx++;

            StringBuilder valueBuilder = new StringBuilder();
            for (int i = idx; i < parts.length; i++) {
                if (i > idx) valueBuilder.append(" ");
                valueBuilder.append(parts[i]);
            }
            String value = valueBuilder.toString();

            // Handle CONC and CONT
            if ("CONC".equals(tag) && last != null) {
                last.value = last.value + value;
                continue;
            }
            if ("CONT".equals(tag) && last != null) {
                last.value = last.value + "\n" + value;
                continue;
            }

            GedcomLine line = new GedcomLine(level, xref, tag, value);
            result.add(line);
            last = line;
        }

        return result;
    }

    private List<ParsedNode> buildTree(List<GedcomLine> lines) {
        List<ParsedNode> root = new ArrayList<>();
        Deque<StackEntry> stack = new LinkedList<>();

        for (GedcomLine line : lines) {
            ParsedNode node = new ParsedNode(line);

            while (!stack.isEmpty() && stack.peek().level >= line.level) {
                stack.pop();
            }

            if (stack.isEmpty()) {
                root.add(node);
            } else {
                stack.peek().node.children.add(node);
            }

            stack.push(new StackEntry(node, line.level));
        }

        return root;
    }

    private String getChildValue(ParsedNode node, String tag) {
        for (ParsedNode child : node.children) {
            if (tag.equals(child.line.tag)) {
                return child.line.value;
            }
        }
        return null;
    }

    private String getSubChildValue(ParsedNode node, String parentTag, String childTag) {
        for (ParsedNode child : node.children) {
            if (parentTag.equals(child.line.tag)) {
                return getChildValue(child, childTag);
            }
        }
        return null;
    }

    private String[] parseName(String value) {
        if (value == null) return new String[]{"", ""};
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("^(.+?)\\s*/(.+?)/$").matcher(value);
        if (m.find()) {
            return new String[]{m.group(1).trim(), m.group(2).trim()};
        }
        String[] parts = value.split("\\s+");
        return new String[]{parts[0], parts.length > 1 ? String.join(" ", Arrays.copyOfRange(parts, 1, parts.length)) : ""};
    }

    private String parseGedcomDate(String gedcomDate) {
        if (gedcomDate == null) return null;
        try {
            String[] parts = gedcomDate.split("\\s+");
            if (parts.length >= 3) {
                String day = parts[0];
                String month = switch (parts[1].toUpperCase()) {
                    case "JAN" -> "01"; case "FEB" -> "02"; case "MAR" -> "03";
                    case "APR" -> "04"; case "MAY" -> "05"; case "JUN" -> "06";
                    case "JUL" -> "07"; case "AUG" -> "08"; case "SEP" -> "09";
                    case "OCT" -> "10"; case "NOV" -> "11"; case "DEC" -> "12";
                    default -> "00";
                };
                String year = parts[2];
                if (day.length() == 1) day = "0" + day;
                return year + "-" + month + "-" + day;
            }
            if (parts.length == 1) {
                return parts[0];
            }
        } catch (Exception ignored) {}
        return gedcomDate;
    }

    private static class GedcomLine {
        int level;
        String xref;
        String tag;
        String value;
        GedcomLine(int level, String xref, String tag, String value) {
            this.level = level;
            this.xref = xref;
            this.tag = tag;
            this.value = value;
        }
    }
    private static class ParsedNode {
        GedcomLine line;
        List<ParsedNode> children = new ArrayList<>();
        ParsedNode(GedcomLine line) { this.line = line; }
    }
    private record StackEntry(ParsedNode node, int level) {}
}
