package com.genealogie.layout;

import com.genealogie.model.*;

import java.util.*;
import java.util.stream.Collectors;

public class TreeLayoutEngine {
    public static final double NODE_W = FamilyTree.NODE_W;
    public static final double NODE_H = FamilyTree.NODE_H;
    private static final double H_GAP = 30;
    private static final double V_GAP = 100;
    private static final double SPOUSE_GAP = 16;
    private static final double PADDING = 60;

    public TreeLayout compute(FamilyTree tree, String rootId) {
        if (rootId == null || tree.getPeople().isEmpty()) {
            return TreeLayout.empty(rootId);
        }

        BfsResult bfs = collectAll(tree, rootId);
        Map<String, Double> positions = new HashMap<>();
        List<LayoutEdge> edges = new ArrayList<>();
        Map<String, Integer> gen = bfs.gen;
        Set<String> ids = bfs.ids;

        List<Integer> sortedGens = gen.values().stream().distinct().sorted().toList();
        if (sortedGens.isEmpty()) return TreeLayout.empty(rootId);

        int minGen = sortedGens.get(0);

        // Phase 1: Group by generation, form spousal units
        Map<Integer, List<List<String>>> genUnits = new LinkedHashMap<>();
        Map<Integer, Integer> genColCount = new HashMap<>();

        for (int g : sortedGens) {
            List<String> personsInGen = ids.stream().filter(id -> gen.get(id) == g).collect(Collectors.toList());
            List<List<String>> units = new ArrayList<>();
            Set<String> used = new HashSet<>();

            for (String pid : personsInGen) {
                if (used.contains(pid)) continue;
                List<String> spouses = findSpousesInGen(tree, pid, g, gen);
                spouses.removeIf(s -> !personsInGen.contains(s) || used.contains(s));

                if (spouses.isEmpty()) {
                    units.add(new ArrayList<>(List.of(pid)));
                    used.add(pid);
                } else {
                    // Secondary spouse reordering
                    List<String> allInUnit = new ArrayList<>();
                    allInUnit.add(pid);
                    allInUnit.addAll(spouses);

                    Set<String> allInUnitSet = new HashSet<>(allInUnit);
                    for (List<String> existingUnit : units) {
                        if (existingUnit.size() == 1) {
                            String eid = existingUnit.get(0);
                            if (allInUnitSet.contains(eid)) {
                                existingUnit.addAll(allInUnit);
                                allInUnitSet.addAll(existingUnit);
                                used.addAll(existingUnit);
                                allInUnit.clear();
                                break;
                            }
                        }
                    }
                    if (!allInUnit.isEmpty()) {
                        units.add(allInUnit);
                        used.addAll(allInUnit);
                    }
                }
            }

            genUnits.put(g, units);
            int col = 0;
            for (List<String> unit : units) {
                col += unit.size() > 1 ? 2 : 1;
            }
            genColCount.put(g, Math.max(col, 1));
        }

        // Phase 2: Assign X,Y positions + spouse edges
        Map<String, LayoutPosition> layoutPositions = new HashMap<>();
        Set<String> hasSpouseEdge = new HashSet<>();
        Set<String> visitedFamilies = new HashSet<>();
        for (int g : sortedGens) {
            int row = g - minGen;
            double yVal = PADDING + row * (NODE_H + V_GAP);
            double col = 0;
            for (List<String> unit : genUnits.get(g)) {
                if (unit.size() > 1) {
                    for (int i = 0; i < unit.size(); i++) {
                        double xVal = PADDING + (col + i) * (NODE_W + SPOUSE_GAP);
                        layoutPositions.put(unit.get(i), new LayoutPosition(xVal, yVal));
                    }
                    col += unit.size();
                } else {
                    layoutPositions.put(unit.get(0), new LayoutPosition(PADDING + col * (NODE_W + SPOUSE_GAP), yVal));
                    col += 1;
                }
            }
            // Spouse edges (React semantics)
            List<String> gIds = ids.stream().filter(id -> gen.get(id) == g).toList();
            for (String pid : gIds) {
                for (Family f : tree.getFamilies().values()) {
                    if (visitedFamilies.contains(f.getId())) continue;
                    if (!f.hasParent(pid)) continue;
                    String spouseId = f.getParent1Id() != null && !f.getParent1Id().equals(pid) ? f.getParent1Id()
                            : f.getParent2Id() != null && !f.getParent2Id().equals(pid) ? f.getParent2Id() : null;
                    if (spouseId == null || gen.getOrDefault(spouseId, -1) != g) continue;
                    boolean autoDash = hasSpouseEdge.contains(pid) || hasSpouseEdge.contains(spouseId);
                    boolean dashed = f.isDashed() || autoDash;
                    edges.add(new LayoutEdge(pid, spouseId, "spouse", f.getId(), dashed));
                    hasSpouseEdge.add(pid);
                    hasSpouseEdge.add(spouseId);
                    visitedFamilies.add(f.getId());
                }
            }
        }

        // Phase 3: Center children under parents
        Map<String, Double> childDx = new HashMap<>();
        for (int g : sortedGens) {
            for (String pid : ids.stream().filter(id -> gen.get(id) == g).collect(Collectors.toList())) {
                List<String> childIds = new ArrayList<>();
                List<Family> families = tree.getPersonFamilies(pid);
                for (Family f : families) {
                    int parentG = g;
                    int childG = parentG + 1;
                    for (String cid : f.getChildrenIds()) {
                        if (gen.containsKey(cid) && gen.get(cid) == childG) {
                            childIds.add(cid);
                        }
                    }
                }

                if (childIds.isEmpty()) continue;

                // Check if child has a spouse in their generation
                childIds.removeIf(cid -> {
                    int cGen = gen.get(cid);
                    List<String> cSpouses = findSpousesInGen(tree, cid, cGen, gen);
                    return !cSpouses.isEmpty();
                });

                if (childIds.isEmpty()) continue;

                // Find spouse
                String spouseId = findSpouseInGen(tree, pid, g, gen);
                LayoutPosition pPos = layoutPositions.get(pid);
                LayoutPosition sPos = spouseId != null ? layoutPositions.get(spouseId) : null;
                if (pPos == null) continue;

                double parentCenter;
                if (sPos != null) {
                    parentCenter = (pPos.getX() + sPos.getX() + NODE_W) / 2;
                } else {
                    parentCenter = pPos.getX() + NODE_W / 2;
                }

                for (String cid : childIds) {
                    LayoutPosition cPos = layoutPositions.get(cid);
                    if (cPos != null) {
                        double dx = parentCenter - NODE_W / 2 - cPos.getX();
                        childDx.putIfAbsent(cid, dx);
                    }
                }
            }
        }

        // Apply child centering
        for (Map.Entry<String, Double> e : childDx.entrySet()) {
            LayoutPosition pos = layoutPositions.get(e.getKey());
            if (pos != null) {
                pos.setX(pos.getX() + e.getValue());
            }
        }

        // Phase 3b: Shift parents above children (React semantics: iterate families)
        Map<String, Double> parentDx = new HashMap<>();
        for (Family f : tree.getFamilies().values()) {
            List<String> parentIds = f.getParentIds().stream()
                    .filter(layoutPositions::containsKey).toList();
            if (parentIds.isEmpty()) continue;
            if (parentIds.size() == 1 && hasSpouseInSameGen(tree, parentIds.get(0), gen)) continue;

            int parentGen = gen.getOrDefault(parentIds.get(0), 0);
            int childGen = parentGen + 1;
            List<String> below = f.getChildrenIds().stream()
                    .filter(cid -> layoutPositions.containsKey(cid) && gen.getOrDefault(cid, 0) == childGen)
                    .toList();
            if (below.isEmpty()) continue;

            double childAvg = below.stream()
                    .mapToDouble(cid -> layoutPositions.get(cid).getX() + NODE_W / 2)
                    .average().orElse(0);
            double parentMid = parentIds.stream()
                    .mapToDouble(pid -> layoutPositions.get(pid).getX() + NODE_W / 2)
                    .average().orElse(0);
            double dx = childAvg - parentMid;
            if (Math.abs(dx) <= 5) continue;
            for (String pid : parentIds) {
                parentDx.merge(pid, dx, Math::max);
            }
        }
        for (Map.Entry<String, Double> e : parentDx.entrySet()) {
            LayoutPosition pos = layoutPositions.get(e.getKey());
            if (pos != null) pos.setX(pos.getX() + e.getValue());
        }

        // Overlap resolution per generation
        for (int g : sortedGens) {
            List<String> gIds = ids.stream().filter(id -> gen.get(id) == g)
                    .sorted(Comparator.comparingDouble(id -> layoutPositions.get(id) != null ? layoutPositions.get(id).getX() : 0))
                    .collect(Collectors.toList());

            for (int i = 1; i < gIds.size(); i++) {
                LayoutPosition prev = layoutPositions.get(gIds.get(i - 1));
                LayoutPosition curr = layoutPositions.get(gIds.get(i));
                if (prev == null || curr == null) continue;

                double overlap = prev.getX() + NODE_W + H_GAP - curr.getX();
                if (overlap > 0) {
                    for (int j = i; j < gIds.size(); j++) {
                        LayoutPosition p = layoutPositions.get(gIds.get(j));
                        if (p != null) {
                            p.setX(p.getX() + overlap);
                        }
                    }
                }
            }
        }

        // Phase 4: Parent-child edges (pedigree style)
        for (Family f : tree.getFamilies().values()) {
            List<String> parentIds = f.getParentIds();
            if (parentIds.isEmpty()) continue;

            int parentGen = gen.getOrDefault(parentIds.get(0), 0);
            int childGen = parentGen + 1;

            for (String cid : f.getChildrenIds()) {
                if (gen.containsKey(cid) && gen.get(cid) == childGen) {
                    edges.add(new LayoutEdge(parentIds.get(0), cid, "parent-child", f.getId(), false));
                }
            }
        }

        // Apply manual position overrides
        for (String pid : tree.getPersonPositions().keySet()) {
            LayoutPosition manual = tree.getPersonPositions().get(pid);
            if (layoutPositions.containsKey(pid)) {
                layoutPositions.put(pid, manual.copy());
            }
        }

        // Bounds
        double minX = Double.MAX_VALUE, minY = Double.MAX_VALUE;
        double maxX = -Double.MAX_VALUE, maxY = -Double.MAX_VALUE;
        for (LayoutPosition pos : layoutPositions.values()) {
            minX = Math.min(minX, pos.getX());
            minY = Math.min(minY, pos.getY());
            maxX = Math.max(maxX, pos.getX() + NODE_W);
            maxY = Math.max(maxY, pos.getY() + NODE_H);
        }
        if (layoutPositions.isEmpty()) {
            minX = 0; minY = 0; maxX = 800; maxY = 600;
        }

        TreeLayout result = new TreeLayout();
        result.setPositions(layoutPositions);
        result.setEdges(edges);
        result.setMinX(minX);
        result.setMinY(minY);
        result.setMaxX(maxX);
        result.setMaxY(maxY);
        result.setRootId(rootId);
        return result;
    }

    private BfsResult collectAll(FamilyTree tree, String rootId) {
        Set<String> ids = new LinkedHashSet<>();
        Map<String, Integer> gen = new HashMap<>();

        Queue<BfsEntry> queue = new LinkedList<>();
        queue.add(new BfsEntry(rootId, 0));

        while (!queue.isEmpty()) {
            BfsEntry entry = queue.poll();
            String pid = entry.id;
            int g = entry.generation;

            if (ids.contains(pid)) continue;
            ids.add(pid);
            gen.put(pid, g);

            Person person = tree.getPerson(pid);
            if (person == null) continue;

            // Ancestors (up)
            Family parentFamily = tree.getPersonParentFamily(pid);
            if (parentFamily != null) {
                if (parentFamily.getParent1Id() != null) queue.add(new BfsEntry(parentFamily.getParent1Id(), g - 1));
                if (parentFamily.getParent2Id() != null) queue.add(new BfsEntry(parentFamily.getParent2Id(), g - 1));
            }

            // Spouses
            for (Family f : tree.getPersonFamilies(pid)) {
                String spouseId = f.getParent1Id() != null && !f.getParent1Id().equals(pid) ? f.getParent1Id()
                        : f.getParent2Id() != null && !f.getParent2Id().equals(pid) ? f.getParent2Id() : null;
                if (spouseId != null) queue.add(new BfsEntry(spouseId, g));

                // Descendants
                for (String cid : f.getChildrenIds()) {
                    queue.add(new BfsEntry(cid, g + 1));
                }
            }
        }

        // Handle disconnected people
        int maxGen = gen.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        for (String pid : tree.getPeople().keySet()) {
            if (!ids.contains(pid)) {
                ids.add(pid);
                gen.put(pid, maxGen + 1);
            }
        }

        return new BfsResult(ids, gen);
    }

    private List<String> findSpousesInGen(FamilyTree tree, String personId, int g, Map<String, Integer> gen) {
        List<String> spouses = new ArrayList<>();
        for (Family f : tree.getPersonFamilies(personId)) {
            String spouseId = f.getParent1Id() != null && !f.getParent1Id().equals(personId) ? f.getParent1Id()
                    : f.getParent2Id() != null && !f.getParent2Id().equals(personId) ? f.getParent2Id() : null;
            if (spouseId != null && gen.containsKey(spouseId) && gen.get(spouseId) == g) {
                spouses.add(spouseId);
            }
        }
        return spouses;
    }

    private String findSpouseInGen(FamilyTree tree, String personId, int g, Map<String, Integer> gen) {
        List<String> spouses = findSpousesInGen(tree, personId, g, gen);
        return spouses.isEmpty() ? null : spouses.get(0);
    }

    private boolean hasSpouseInSameGen(FamilyTree tree, String personId, Map<String, Integer> gen) {
        Integer g = gen.get(personId);
        if (g == null) return false;
        return !findSpousesInGen(tree, personId, g, gen).isEmpty();
    }

    private record BfsEntry(String id, int generation) {}
    private record BfsResult(Set<String> ids, Map<String, Integer> gen) {}
}
