package com.genealogie.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SPAForward {
    @RequestMapping(value = {"/", "/tree/**", "/**/{path:[^.\\s]*}"})
    public String forward() {
        return "forward:/index.html";
    }
}
