const labels = {
  0x015b: "test_jmp_1",
  0x0170: "err_jmp_minus_2",
  0x018d: "err_jmp_minus_1",
  0x01a8: "err_jmp_plus_1",
  0x01c5: "err_jmp_plus_2",
  0x0166: "test_jmp_2",
  0x01e4: "test_jt_no_jump",
  0x01e7: "test_jf_no_jump",
  0x01ea: "test_jt_jump",
  0x01ef: "test_jf_jump",
  0x01f4: "test_r0_initial_value",
  0x01f7: "test_r1_initial_value",
  0x01fa: "test_r2_initial_value",
  0x01fd: "test_r3_initial_value",
  0x0200: "test_r4_initial_value",
  0x0203: "test_r5_initial_value",
  0x0206: "test_r6_initial_value",
  0x0209: "test_r7_initial_value",
  0x021f: "err_no_add",
  0x0234: "test_eq",
  0x023b: "err_no_eq",
  0x024e: "test_push_pop",
  0x0264: "test_gt",
  0x0279: "test_and",
  0x0284: "test_or",
  0x028f: "err_no_or",
  0x02ac: "test_not",
  0x02c0: "test_call_with_address",
  0x02c4: "verify_stack",
  0x02d4: "test_call_with_register",
  0x02db: "verify_stack_2",
  0x02eb: "test_add_modulo",
  0x030b: "test_mult",
  0x0328: "test_mod",
  0x034b: "rmem_data",
  0x034d: "test_rmem",
  0x0365: "test_wmem",
  0x03ad: "err_wmem",
  0x03d2: "fct_xxx",
  0x0432: "err_no_jt_jf",
  0x0445: "err_non_zero_register",
  0x045e: "err_no_set",
  0x0473: "err_no_gt",
  0x0486: "err_no_stack",
  0x0499: "err_no_and",
  0x04b8: "err_no_not",
  0x04d7: "err_no_rmem",
  0x04ee: "err_no_wmem",
  0x0505: "jumping_function",
  0x0507: "jumping_function_2",
  0x0509: "err_no_call",
  0x0520: "err_no_modulo_add_mult",
  0x0565: "err_no_hitchhiking",
  0x0586: "err_no_mult",
  0x059d: "err_no_mod",
  0x05b2: "map(array:r0, fct:r1)",
  0x05ee: "printString(r0)",
  0x05f8: "out(r0)",
  0x06bb: "decrypt",
  0x06c2: "_decrypt_loop",
  0x084d: "xor(r0,r1)",
  0x17b4: "s_test_string",
  0x17c0: "s_self_test_result",
  0x17d3: "s_all_tests_pass",
  0x17e4: "s_complete",
  0x17ed: "a_???",
  0x17f1: "a_???",
  0x17fe: "s_foothills",
  0x1808: "s_foothills_desc",
  0x18c0: "s_foothills_dir_1",
  0x18c8: "s_foothills_dir_2",
  0x18ce: "s_foothills_south",
  0x18d8: "s_foothills_south_desc",
  0x1923: "s_foothills_south_dir_1",
  0x1929: "s_dark_cave",
  0x1933: "s_dark_cave_desc",
  0x19b9: "s_dark_cave_dir_1",
  0x19bf: "s_dark_cave_dir_2",
  0x4af8: "s_orb",
  0x4afc: "s_orb_desc",
  0x4b3a: "s_mirror",
  0x4b41: "s_mirror_desc",
  0x4bb8: "s_book",
  0x4bc5: "s_book_content",
  0x564d: "s_journal",
  0x5655: "s_journal_content",
  0x650a: "s_letters",
  0x6597: "s_green",
  0x659d: "s_red",
  0x65a1: "s_yellow",
  0x65a8: "s_???",
  0x65e8: "s_???",
  0x660a: "s_???",
  0x663a: "s_???",
  0x667b: "s_???",
  0x669b: "s_???",
  0x66bb: "s_???",
  0x66d1: "s_???",
  0x66f2: "s_???",
  0x671e: "s_???",
  0x695b: "a_???",
  0x7007: "a_???",
  0x7026: "a_???",
  0x7069: "a_???",
  0x70ac: "a_???",
  0x7156: "a_???",
  0x7239: "a_???",
  0x723d: "a_???",
  0x72d8: "a_???",
  0x7369: "a_???",
  0x73df: "a_???",
  0x73e3: "a_???",
  0x743d: "a_???",
  0x74f6: "a_???",
  0x74fa: "a_???",
}

function labelFor(address) {
  return labels[address] || "";
}

module.exports = {
  labelFor
}