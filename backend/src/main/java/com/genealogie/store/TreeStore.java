package com.genealogie.store;

import com.genealogie.model.*;
import com.google.gson.*;
import com.google.gson.reflect.TypeToken;

import java.io.*;
import java.lang.reflect.Type;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

public class TreeStore {
    private static final File DATA_FILE = new File(System.getProperty("user.home"), ".genealogie/trees.json");

    private static final Gson GSON = new GsonBuilder()
            .setPrettyPrinting()
            .registerTypeAdapter(Gender.class, (JsonSerializer<Gender>) (src, type, context) -> new JsonPrimitive(src.name().toLowerCase()))
            .registerTypeAdapter(Gender.class, (JsonDeserializer<Gender>) (json, type, context) -> Gender.fromJson(json.getAsString()))
            .create();

    private List<FamilyTree> trees;
    private String currentTreeId;
    private String selectedPersonId;
    private static final TreeStore INSTANCE = new TreeStore();

    private TreeStore() {
        trees = new ArrayList<>();
        load();
    }

    public static TreeStore getInstance() {
        return INSTANCE;
    }

    public static Gson getGson() {
        return GSON;
    }

    private void notifyChange() {
        save();
    }

    // === Trees ===

    public List<FamilyTree> getTrees() { return trees; }

    public String getCurrentTreeId() { return currentTreeId; }

    public void setCurrentTree(String id) {
        this.currentTreeId = id;
        notifyChange();
    }

    public String getSelectedPersonId() { return selectedPersonId; }

    public void setSelectedPerson(String id) {
        this.selectedPersonId = id;
        notifyChange();
    }

    public FamilyTree getCurrentTree() {
        if (currentTreeId == null) return null;
        return trees.stream().filter(t -> t.getId().equals(currentTreeId)).findFirst().orElse(null);
    }

    public String createTree(String name) {
        String id = IdGenerator.generateTreeId();
        FamilyTree tree = new FamilyTree(id, name);
        tree.setCreatedAt(LocalDateTime.now().toString());
        tree.setUpdatedAt(tree.getCreatedAt());
        trees.add(tree);
        currentTreeId = id;
        notifyChange();
        return id;
    }

    public void deleteTree(String id) {
        trees.removeIf(t -> t.getId().equals(id));
        if (Objects.equals(currentTreeId, id)) {
            currentTreeId = trees.isEmpty() ? null : trees.get(0).getId();
        }
        notifyChange();
    }

    public void updateTree(String id, String name) {
        FamilyTree tree = findTree(id);
        if (tree != null) {
            tree.setName(name);
            tree.touch();
            notifyChange();
        }
    }

    // === People ===

    public void addPerson(String treeId, Person person) {
        FamilyTree tree = findTree(treeId);
        if (tree != null) {
            tree.getPeople().put(person.getId(), person);
            tree.touch();
            notifyChange();
        }
    }

    public void updatePerson(String treeId, String personId, Person updates) {
        FamilyTree tree = findTree(treeId);
        if (tree != null) {
            Person p = tree.getPerson(personId);
            if (p != null) {
                if (updates.getFirstName() != null) p.setFirstName(updates.getFirstName());
                if (updates.getLastName() != null) p.setLastName(updates.getLastName());
                if (updates.getGender() != null) p.setGender(updates.getGender());
                p.setBirthDate(updates.getBirthDate());
                p.setDeathDate(updates.getDeathDate());
                p.setBirthPlace(updates.getBirthPlace());
                p.setDeathPlace(updates.getDeathPlace());
                p.setPhoto(updates.getPhoto());
                p.setOccupation(updates.getOccupation());
                p.setNotes(updates.getNotes());
                tree.touch();
                notifyChange();
            }
        }
    }

    public void removePerson(String treeId, String personId) {
        FamilyTree tree = findTree(treeId);
        if (tree != null) {
            tree.getPeople().remove(personId);
            tree.getPersonPositions().remove(personId);
            for (Family f : tree.getFamilies().values()) {
                if (Objects.equals(f.getParent1Id(), personId)) f.setParent1Id(null);
                if (Objects.equals(f.getParent2Id(), personId)) f.setParent2Id(null);
                f.getChildrenIds().removeIf(cid -> cid.equals(personId));
            }
            if (Objects.equals(selectedPersonId, personId)) {
                selectedPersonId = null;
            }
            tree.touch();
            notifyChange();
        }
    }

    // === Families ===

    public void addFamily(String treeId, Family family) {
        FamilyTree tree = findTree(treeId);
        if (tree != null) {
            tree.getFamilies().put(family.getId(), family);
            tree.touch();
            notifyChange();
        }
    }

    public void updateFamily(String treeId, String familyId, Map<String, Object> updates) {
        FamilyTree tree = findTree(treeId);
        if (tree != null) {
            Family f = tree.getFamily(familyId);
            if (f != null) {
                if (updates.containsKey("parent1Id")) f.setParent1Id((String) updates.get("parent1Id"));
                if (updates.containsKey("parent2Id")) f.setParent2Id((String) updates.get("parent2Id"));
                if (updates.containsKey("childrenIds")) {
                    @SuppressWarnings("unchecked")
                    List<String> ids = (List<String>) updates.get("childrenIds");
                    f.setChildrenIds(new ArrayList<>(ids));
                }
                if (updates.containsKey("dashed")) f.setDashed((Boolean) updates.get("dashed"));
                if (updates.containsKey("marriageDate")) f.setMarriageDate((String) updates.get("marriageDate"));
                if (updates.containsKey("divorceDate")) f.setDivorceDate((String) updates.get("divorceDate"));
                tree.touch();
                notifyChange();
            }
        }
    }

    public void removeFamily(String treeId, String familyId) {
        FamilyTree tree = findTree(treeId);
        if (tree != null) {
            tree.getFamilies().remove(familyId);
            tree.touch();
            notifyChange();
        }
    }

    // === Smart add helpers ===

    public Person addParent(String treeId, String personId, Gender gender) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return null;

        Family parentFamily = tree.getPersonParentFamily(personId);
        if (parentFamily != null) {
            String existingId = (gender == Gender.MALE) ? parentFamily.getParent1Id() : parentFamily.getParent2Id();
            if (existingId != null) return null;
        }

        Person parent = new Person(IdGenerator.generatePersonId(), "", "", gender);
        tree.getPeople().put(parent.getId(), parent);

        if (parentFamily != null) {
            if (gender == Gender.MALE) {
                parentFamily.setParent1Id(parent.getId());
            } else {
                parentFamily.setParent2Id(parent.getId());
            }
        } else {
            Family newFam = new Family(IdGenerator.generateFamilyId());
            if (gender == Gender.MALE) {
                newFam.setParent1Id(parent.getId());
            } else {
                newFam.setParent2Id(parent.getId());
            }
            newFam.getChildrenIds().add(personId);
            tree.getFamilies().put(newFam.getId(), newFam);
        }

        tree.touch();
        notifyChange();
        return parent;
    }

    public Map.Entry<Person, Family> addSpouse(String treeId, String personId) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return null;

        Person spouse = new Person(IdGenerator.generatePersonId(), "", "", Gender.OTHER);
        Family family = new Family(IdGenerator.generateFamilyId());
        Person person = tree.getPerson(personId);
        if (person == null) return null;

        family.setParent1Id(personId);
        family.setParent2Id(spouse.getId());

        tree.getPeople().put(spouse.getId(), spouse);
        tree.getFamilies().put(family.getId(), family);
        tree.touch();
        notifyChange();
        return new AbstractMap.SimpleEntry<>(spouse, family);
    }

    public Person addChild(String treeId, String personId) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return null;

        Person child = new Person(IdGenerator.generatePersonId(), "", "", Gender.OTHER);
        tree.getPeople().put(child.getId(), child);

        List<Family> families = tree.getPersonFamilies(personId);
        Family family;
        if (families.isEmpty()) {
            family = new Family(IdGenerator.generateFamilyId());
            family.setParent1Id(personId);
            tree.getFamilies().put(family.getId(), family);
        } else {
            family = families.get(0);
        }
        family.getChildrenIds().add(child.getId());

        tree.touch();
        notifyChange();
        return child;
    }

    public Person addSibling(String treeId, String personId) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return null;

        Person sibling = new Person(IdGenerator.generatePersonId(), "", "", Gender.OTHER);
        tree.getPeople().put(sibling.getId(), sibling);

        Family parentFamily = tree.getPersonParentFamily(personId);
        if (parentFamily != null) {
            parentFamily.getChildrenIds().add(sibling.getId());
        } else {
            Person person = tree.getPerson(personId);
            if (person == null) return null;
            Family parent = new Family(IdGenerator.generateFamilyId());
            Person parent1 = new Person(IdGenerator.generatePersonId(), "", "", Gender.MALE);
            Person parent2 = new Person(IdGenerator.generatePersonId(), "", "", Gender.FEMALE);
            tree.getPeople().put(parent1.getId(), parent1);
            tree.getPeople().put(parent2.getId(), parent2);
            parent.setParent1Id(parent1.getId());
            parent.setParent2Id(parent2.getId());
            parent.getChildrenIds().add(personId);
            parent.getChildrenIds().add(sibling.getId());
            tree.getFamilies().put(parent.getId(), parent);
        }

        tree.touch();
        notifyChange();
        return sibling;
    }

    public Person addHalfSibling(String treeId, String personId, String sharedParentId) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return null;

        Person sibling = new Person(IdGenerator.generatePersonId(), "", "", Gender.OTHER);
        Family newFam = new Family(IdGenerator.generateFamilyId());
        newFam.setParent1Id(sharedParentId);
        newFam.getChildrenIds().add(sibling.getId());

        tree.getPeople().put(sibling.getId(), sibling);
        tree.getFamilies().put(newFam.getId(), newFam);
        tree.touch();
        notifyChange();
        return sibling;
    }

    public Person addCousin(String treeId, String personId) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return null;

        // 1. Find or create parentFamily
        Family parentFamily = tree.getPersonParentFamily(personId);
        if (parentFamily == null) {
            Person father = new Person(IdGenerator.generatePersonId(), "", "", Gender.MALE);
            Person mother = new Person(IdGenerator.generatePersonId(), "", "", Gender.FEMALE);
            tree.getPeople().put(father.getId(), father);
            tree.getPeople().put(mother.getId(), mother);
            parentFamily = new Family(IdGenerator.generateFamilyId());
            parentFamily.setParent1Id(father.getId());
            parentFamily.setParent2Id(mother.getId());
            parentFamily.getChildrenIds().add(personId);
            tree.getFamilies().put(parentFamily.getId(), parentFamily);
        }

        // 2. Pick first available parent
        String parentId = parentFamily.getParent1Id() != null ? parentFamily.getParent1Id() : parentFamily.getParent2Id();
        if (parentId == null) return null;

        // 3. Find or create grandparentFamily
        Family grandparentFamily = null;
        for (Family f : tree.getFamilies().values()) {
            if (f.getChildrenIds().contains(parentId)) {
                grandparentFamily = f;
                break;
            }
        }
        if (grandparentFamily == null) {
            Person gf = new Person(IdGenerator.generatePersonId(), "", "", Gender.MALE);
            Person gm = new Person(IdGenerator.generatePersonId(), "", "", Gender.FEMALE);
            tree.getPeople().put(gf.getId(), gf);
            tree.getPeople().put(gm.getId(), gm);
            grandparentFamily = new Family(IdGenerator.generateFamilyId());
            grandparentFamily.setParent1Id(gf.getId());
            grandparentFamily.setParent2Id(gm.getId());
            grandparentFamily.getChildrenIds().add(parentId);
            tree.getFamilies().put(grandparentFamily.getId(), grandparentFamily);
        }

        // 4. Create uncle + aunt + uncleFamily + cousin
        Person uncle = new Person(IdGenerator.generatePersonId(), "", "", Gender.OTHER);
        Person aunt = new Person(IdGenerator.generatePersonId(), "", "", Gender.OTHER);
        tree.getPeople().put(uncle.getId(), uncle);
        tree.getPeople().put(aunt.getId(), aunt);

        Family uncleFamily = new Family(IdGenerator.generateFamilyId());
        uncleFamily.setParent1Id(uncle.getId());
        uncleFamily.setParent2Id(aunt.getId());

        Person cousin = new Person(IdGenerator.generatePersonId(), "", "", Gender.OTHER);
        tree.getPeople().put(cousin.getId(), cousin);
        uncleFamily.getChildrenIds().add(cousin.getId());
        tree.getFamilies().put(uncleFamily.getId(), uncleFamily);

        // 5. Add uncle to grandparentFamily
        grandparentFamily.getChildrenIds().add(uncle.getId());

        tree.touch();
        notifyChange();
        return cousin;
    }

    // === Link existing people ===

    public void linkAsSpouse(String treeId, String person1Id, String person2Id) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return;

        Family family = new Family(IdGenerator.generateFamilyId());
        family.setParent1Id(person1Id);
        family.setParent2Id(person2Id);
        tree.getFamilies().put(family.getId(), family);

        tree.touch();
        notifyChange();
    }

    public void linkAsParent(String treeId, String childId, String parentId) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return;

        Person parent = tree.getPerson(parentId);
        if (parent == null) return;

        Family parentFamily = tree.getPersonParentFamily(childId);
        if (parentFamily != null) {
            String key = (parent.getGender() == Gender.MALE) ? "parent1Id"
                    : (parent.getGender() == Gender.FEMALE) ? "parent2Id" : "parent1Id";
            if ("parent1Id".equals(key)) {
                if (parentFamily.getParent1Id() != null) return;
                parentFamily.setParent1Id(parentId);
            } else {
                if (parentFamily.getParent2Id() != null) return;
                parentFamily.setParent2Id(parentId);
            }
        } else {
            Family newFam = new Family(IdGenerator.generateFamilyId());
            newFam.setParent1Id(parentId);
            newFam.getChildrenIds().add(childId);
            tree.getFamilies().put(newFam.getId(), newFam);
        }

        tree.touch();
        notifyChange();
    }

    public void linkAsChild(String treeId, String parentId, String childId) {
        linkAsParent(treeId, childId, parentId);
    }

    public void linkAsSibling(String treeId, String person1Id, String person2Id) {
        FamilyTree tree = findTree(treeId);
        if (tree == null) return;

        Family parentFamily = tree.getPersonParentFamily(person1Id);
        if (parentFamily != null) {
            if (!parentFamily.getChildrenIds().contains(person2Id)) {
                parentFamily.getChildrenIds().add(person2Id);
            }
        } else {
            Person p1 = tree.getPerson(person1Id);
            if (p1 == null) return;
            Family parent = new Family(IdGenerator.generateFamilyId());
            Person parent1 = new Person(IdGenerator.generatePersonId(), "", "", Gender.MALE);
            Person parent2 = new Person(IdGenerator.generatePersonId(), "", "", Gender.FEMALE);
            tree.getPeople().put(parent1.getId(), parent1);
            tree.getPeople().put(parent2.getId(), parent2);
            parent.setParent1Id(parent1.getId());
            parent.setParent2Id(parent2.getId());
            parent.getChildrenIds().add(person1Id);
            parent.getChildrenIds().add(person2Id);
            tree.getFamilies().put(parent.getId(), parent);
        }

        tree.touch();
        notifyChange();
    }

    // === Positions ===

    public void setPersonPosition(String treeId, String personId, double x, double y) {
        FamilyTree tree = findTree(treeId);
        if (tree != null && tree.getPeople().containsKey(personId)) {
            tree.getPersonPositions().put(personId, new LayoutPosition(x, y));
            tree.touch();
            notifyChange();
        }
    }

    public void clearPersonPosition(String treeId, String personId) {
        FamilyTree tree = findTree(treeId);
        if (tree != null) {
            tree.getPersonPositions().remove(personId);
            tree.touch();
            notifyChange();
        }
    }

    // === Persistence ===

    private void load() {
        try {
            if (DATA_FILE.exists()) {
                String content = Files.readString(DATA_FILE.toPath());
                if (!content.isBlank()) {
                    Type type = new TypeToken<List<FamilyTree>>() {}.getType();
                    List<FamilyTree> loaded = GSON.fromJson(content, type);
                    if (loaded != null) trees = loaded;
                }
            }
        } catch (Exception e) {
            System.err.println("Erreur de chargement: " + e.getMessage());
        }
    }

    public void save() {
        try {
            DATA_FILE.getParentFile().mkdirs();
            String json = GSON.toJson(trees);
            Files.writeString(DATA_FILE.toPath(), json, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            System.err.println("Erreur de sauvegarde: " + e.getMessage());
        }
    }

    // === Queries ===

    public FamilyTree findTree(String id) {
        return trees.stream().filter(t -> t.getId().equals(id)).findFirst().orElse(null);
    }

    public Person getPerson(String treeId, String personId) {
        FamilyTree tree = findTree(treeId);
        return tree != null ? tree.getPerson(personId) : null;
    }

    public Family getFamily(String treeId, String familyId) {
        FamilyTree tree = findTree(treeId);
        return tree != null ? tree.getFamily(familyId) : null;
    }

    // === Import tree (used by GEDCOM parser) ===

    public void importTree(FamilyTree tree) {
        trees.add(tree);
        currentTreeId = tree.getId();
        notifyChange();
    }
}
