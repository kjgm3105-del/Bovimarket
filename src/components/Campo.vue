<script setup>
import { ref, useId } from "vue";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  options: Array,
  hint: String,
  modelValue: [String, Number],
});
const emit = defineEmits(["update:modelValue"]);
const id = useId(),
  error = ref("");
function validar(el) {
  if (!el.validity.valid) {
    const v = el.validity;
    error.value = v.valueMissing
      ? "Completa este campo."
      : v.typeMismatch
        ? "Escribe un valor válido."
        : v.tooShort
          ? "Escribe al menos " + el.minLength + " caracteres."
          : v.rangeUnderflow
            ? "El mínimo es " + el.min + "."
            : v.rangeOverflow
              ? "El máximo es " + el.max + "."
              : v.patternMismatch
                ? el.title || "Revisa el formato."
                : "Revisa este campo.";
  } else error.value = "";
}
function cambiar(e) {
  const el = e.target;
  emit(
    "update:modelValue",
    props.type === "number" && el.value !== "" ? el.valueAsNumber : el.value,
  );
  validar(el);
}
</script>
<template>
  <div class="campo">
    <label :for="id">{{ label }}</label
    ><component
      :is="options ? 'select' : type === 'textarea' ? 'textarea' : 'input'"
      :id="id"
      v-bind="$attrs"
      :type="!options && type !== 'textarea' ? type : undefined"
      :value="modelValue"
      :aria-invalid="!!error"
      :aria-describedby="error || hint ? id + '-ayuda' : undefined"
      @input="cambiar"
      @change="cambiar"
      @blur="validar($event.target)"
      @invalid="validar($event.target)"
    >
      <template v-if="options"
        ><option value="">Selecciona una opción</option>
        <option v-for="o in options" :key="o" :value="o">
          {{ o }}
        </option></template
      ></component
    ><small
      v-if="hint || error"
      :id="id + '-ayuda'"
      :class="{ fallo: !!error }"
      >{{ error || hint }}</small
    >
  </div>
</template>
