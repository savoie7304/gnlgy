package com.genealogie.store;

import java.security.SecureRandom;

public class IdGenerator {
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generatePersonId() {
        return "@I" + System.currentTimeMillis() + "_" + randomString(4) + "@";
    }

    public static String generateFamilyId() {
        return "@F" + System.currentTimeMillis() + "_" + randomString(4) + "@";
    }

    public static String generateTreeId() {
        return "tree_" + System.currentTimeMillis() + "_" + randomString(8);
    }

    private static String randomString(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
