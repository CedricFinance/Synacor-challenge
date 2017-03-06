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
  0x06bb: "fct_XXX_decrypt",
  0x17b4: "data_??"
}

function labelFor(address) {
  return labels[address] || "";
}

module.exports = {
  labelFor
}