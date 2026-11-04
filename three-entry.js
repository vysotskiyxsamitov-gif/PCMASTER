// Точка входа для сборки three.bundle.js (см. prepare.js).
// Игра написана на глобальном THREE (как в r128), поэтому собираем новый three в один обычный скрипт
// и кладём туда же нужные аддоны для постобработки.
import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Цвета в игре подобраны под старый three (hex-значения без перевода из sRGB в линейное пространство).
// Отключаем автоматическое управление цветом — картинка остаётся прежней, текстуры по-прежнему sRGB.
T.ColorManagement.enabled = false;

// В новых версиях у ламп физический спад (decay = 2) — в игре всё рассчитано на мягкий спад до distance.
// Поэтому по умолчанию decay = 0 (яркость в коде игры уже умножена на π — так было в старом three внутри).
class PointLight extends T.PointLight {
  constructor(c, i, d, decay) { super(c, i, d, decay === undefined ? 0 : decay); }
}
class SpotLight extends T.SpotLight {
  constructor(c, i, d, a, p, decay) { super(c, i, d, a, p, decay === undefined ? 0 : decay); }
}

window.THREE = Object.assign({}, T, { PointLight, SpotLight, EffectComposer, RenderPass, UnrealBloomPass, OutputPass });
