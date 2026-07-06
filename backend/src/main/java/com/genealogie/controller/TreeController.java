package com.genealogie.controller;

import com.genealogie.io.GedcomExporter;
import com.genealogie.io.GedcomParser;
import com.genealogie.layout.TreeLayoutEngine;
import com.genealogie.model.*;
import com.genealogie.store.IdGenerator;
import com.genealogie.store.TreeStore;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class TreeController {

    private final TreeStore store = TreeStore.getInstance();
    private final TreeLayoutEngine layoutEngine = new TreeLayoutEngine();
    private final GedcomParser gedcomParser = new GedcomParser();
    private final GedcomExporter gedcomExporter = new GedcomExporter();

    // === Trees ===

    @GetMapping("/trees")
    public List<FamilyTree> getTrees() {
        return store.getTrees();
    }

    @PostMapping("/trees")
    public FamilyTree createTree(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "Nouvel arbre");
        String id = store.createTree(name);
        return store.findTree(id);
    }

    @DeleteMapping("/trees/{treeId}")
    public ResponseEntity<Void> deleteTree(@PathVariable String treeId) {
        store.deleteTree(treeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trees/{treeId}")
    public ResponseEntity<FamilyTree> getTree(@PathVariable String treeId) {
        FamilyTree tree = store.findTree(treeId);
        return tree != null ? ResponseEntity.ok(tree) : ResponseEntity.notFound().build();
    }

    // === Layout ===

    @GetMapping("/trees/{treeId}/layout")
    public ResponseEntity<TreeLayout> getLayout(@PathVariable String treeId,
                                                 @RequestParam(required = false) String root) {
        FamilyTree tree = store.findTree(treeId);
        if (tree == null) return ResponseEntity.notFound().build();
        String rootId = root != null ? root : tree.findFirstPersonId();
        if (rootId == null) return ResponseEntity.ok(TreeLayout.empty(null));
        return ResponseEntity.ok(layoutEngine.compute(tree, rootId));
    }

    // === People ===

    @PostMapping("/trees/{treeId}/people")
    public ResponseEntity<Person> addPerson(@PathVariable String treeId, @RequestBody Person person) {
        FamilyTree tree = store.findTree(treeId);
        if (tree == null) return ResponseEntity.notFound().build();
        if (person.getId() == null || person.getId().isBlank()) {
            person.setId(IdGenerator.generatePersonId());
        }
        store.addPerson(treeId, person);
        return ResponseEntity.ok(person);
    }

    @PutMapping("/trees/{treeId}/people/{personId}")
    public ResponseEntity<Person> updatePerson(@PathVariable String treeId,
                                                @PathVariable String personId,
                                                @RequestBody Person updates) {
        Person existing = store.getPerson(treeId, personId);
        if (existing == null) return ResponseEntity.notFound().build();
        store.updatePerson(treeId, personId, updates);
        return ResponseEntity.ok(store.getPerson(treeId, personId));
    }

    @DeleteMapping("/trees/{treeId}/people/{personId}")
    public ResponseEntity<Void> removePerson(@PathVariable String treeId, @PathVariable String personId) {
        store.removePerson(treeId, personId);
        return ResponseEntity.noContent().build();
    }

    // === Families ===

    @PostMapping("/trees/{treeId}/families")
    public ResponseEntity<Family> addFamily(@PathVariable String treeId, @RequestBody Family family) {
        FamilyTree tree = store.findTree(treeId);
        if (tree == null) return ResponseEntity.notFound().build();
        if (family.getId() == null || family.getId().isBlank()) {
            family.setId(IdGenerator.generateFamilyId());
        }
        store.addFamily(treeId, family);
        return ResponseEntity.ok(family);
    }

    @PutMapping("/trees/{treeId}/families/{familyId}")
    public ResponseEntity<Family> updateFamily(@PathVariable String treeId,
                                                @PathVariable String familyId,
                                                @RequestBody Map<String, Object> updates) {
        Family existing = store.getFamily(treeId, familyId);
        if (existing == null) return ResponseEntity.notFound().build();
        store.updateFamily(treeId, familyId, updates);
        return ResponseEntity.ok(store.getFamily(treeId, familyId));
    }

    @DeleteMapping("/trees/{treeId}/families/{familyId}")
    public ResponseEntity<Void> removeFamily(@PathVariable String treeId, @PathVariable String familyId) {
        store.removeFamily(treeId, familyId);
        return ResponseEntity.noContent().build();
    }

    // === Smart actions ===

    @PostMapping("/trees/{treeId}/actions/add-parent")
    public ResponseEntity<Person> addParent(@PathVariable String treeId, @RequestBody Map<String, String> body) {
        String personId = body.get("personId");
        String genderStr = body.getOrDefault("gender", "other");
        Gender gender = Gender.fromGedcomCode(genderStr.substring(0, 1).toUpperCase());
        Person p = store.addParent(treeId, personId, gender);
        if (p == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(p);
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/trees/{treeId}/actions/add-spouse")
    public ResponseEntity<Map<String, Object>> addSpouse(@PathVariable String treeId, @RequestBody Map<String, String> body) {
        String personId = body.get("personId");
        Map.Entry<Person, Family> result = store.addSpouse(treeId, personId);
        if (result == null) return ResponseEntity.badRequest().build();
        Map<String, Object> resp = new HashMap<>();
        resp.put("person", result.getKey());
        resp.put("family", result.getValue());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/trees/{treeId}/actions/add-child")
    public ResponseEntity<Person> addChild(@PathVariable String treeId, @RequestBody Map<String, String> body) {
        String personId = body.get("personId");
        Person p = store.addChild(treeId, personId);
        if (p == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(p);
    }

    @PostMapping("/trees/{treeId}/actions/add-sibling")
    public ResponseEntity<Person> addSibling(@PathVariable String treeId, @RequestBody Map<String, String> body) {
        String personId = body.get("personId");
        Person p = store.addSibling(treeId, personId);
        if (p == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(p);
    }

    @PostMapping("/trees/{treeId}/actions/add-half-sibling")
    public ResponseEntity<Person> addHalfSibling(@PathVariable String treeId, @RequestBody Map<String, String> body) {
        String personId = body.get("personId");
        String sharedParentId = body.get("sharedParentId");
        Person p = store.addHalfSibling(treeId, personId, sharedParentId);
        if (p == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(p);
    }

    @PostMapping("/trees/{treeId}/actions/add-cousin")
    public ResponseEntity<Person> addCousin(@PathVariable String treeId, @RequestBody Map<String, String> body) {
        String personId = body.get("personId");
        Person p = store.addCousin(treeId, personId);
        if (p == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(p);
    }

    @PostMapping("/trees/{treeId}/actions/link")
    public ResponseEntity<Void> link(@PathVariable String treeId, @RequestBody Map<String, String> body) {
        String type = body.get("type");
        String person1Id = body.get("person1Id");
        String person2Id = body.get("person2Id");
        switch (type) {
            case "spouse" -> store.linkAsSpouse(treeId, person1Id, person2Id);
            case "parent" -> store.linkAsParent(treeId, person2Id, person1Id);
            case "child" -> store.linkAsChild(treeId, person1Id, person2Id);
            case "sibling" -> store.linkAsSibling(treeId, person1Id, person2Id);
            default -> { return ResponseEntity.badRequest().build(); }
        }
        return ResponseEntity.ok().build();
    }

    // === Positions ===

    @PostMapping("/trees/{treeId}/positions")
    public ResponseEntity<Void> setPosition(@PathVariable String treeId, @RequestBody Map<String, Object> body) {
        String personId = (String) body.get("personId");
        double x = ((Number) body.get("x")).doubleValue();
        double y = ((Number) body.get("y")).doubleValue();
        store.setPersonPosition(treeId, personId, x, y);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/trees/{treeId}/positions/{personId}")
    public ResponseEntity<Void> clearPosition(@PathVariable String treeId, @PathVariable String personId) {
        store.clearPersonPosition(treeId, personId);
        return ResponseEntity.noContent().build();
    }

    // === Native .gnlgy ===

    @GetMapping("/export/native")
    public ResponseEntity<Map<String, Object>> exportNativeAll() {
        List<FamilyTree> all = store.getTrees();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("format", "gnlgy");
        payload.put("version", 1);
        payload.put("trees", all);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sauvegarde.gnlgy\"")
                .body(payload);
    }

    @GetMapping("/export/native/{treeId}")
    public ResponseEntity<Map<String, Object>> exportNative(@PathVariable String treeId) {
        FamilyTree tree = store.findTree(treeId);
        if (tree == null) return ResponseEntity.notFound().build();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("format", "gnlgy");
        payload.put("version", 1);
        payload.put("trees", List.of(tree));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + sanitizeFilename(tree.getName()) + ".gnlgy\"")
                .body(payload);
    }

    @PostMapping("/import/native")
    public ResponseEntity<List<FamilyTree>> importNative(@RequestBody Map<String, Object> body) {
        try {
            if (!"gnlgy".equals(body.get("format"))) {
                return ResponseEntity.badRequest().build();
            }
            Gson gson = TreeStore.getGson();
            Type listType = new TypeToken<List<FamilyTree>>() {}.getType();
            List<FamilyTree> imported = gson.fromJson(gson.toJson(body.get("trees")), listType);
            if (imported == null || imported.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            // Regenerate tree IDs to avoid collisions
            for (FamilyTree t : imported) {
                t.setId(IdGenerator.generateTreeId());
                store.importTree(t);
            }
            return ResponseEntity.ok(imported);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String sanitizeFilename(String name) {
        return name.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }

    // === GEDCOM ===

    @PostMapping("/import/gedcom")
    public ResponseEntity<FamilyTree> importGedcom(@RequestParam("file") MultipartFile file) {
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            FamilyTree tree = gedcomParser.parse(content);
            store.importTree(tree);
            return ResponseEntity.ok(tree);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/trees/{treeId}/export/gedcom")
    public ResponseEntity<String> exportGedcom(@PathVariable String treeId) {
        FamilyTree tree = store.findTree(treeId);
        if (tree == null) return ResponseEntity.notFound().build();
        String content = gedcomExporter.export(tree);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + tree.getName() + ".ged\"")
                .body(content);
    }
}
