import { describe, it, expect } from 'vitest';
import { compilePrompt, finishToColorSystems, CAMERA_LIBRARY } from '@/lib/promptLibrary';

describe('finishToColorSystems', () => {
  it('maps flake finishes', () => {
    expect(finishToColorSystems('flake-epoxy')).toEqual(['flake']);
  });
  it('maps metallic finishes', () => {
    expect(finishToColorSystems('Metallic Epoxy')).toEqual(['metallic']);
  });
  it('maps quartz', () => {
    expect(finishToColorSystems('quartz-system')).toEqual(['quartz']);
  });
  it('maps glitter', () => {
    expect(finishToColorSystems('glitter-epoxy')).toEqual(['glitter']);
  });
  it('maps stained to dye_stain', () => {
    expect(finishToColorSystems('stained-concrete')).toEqual(['dye_stain']);
  });
  it('maps polished/sealed/overlay to solid', () => {
    expect(finishToColorSystems('polished-concrete')).toEqual(['solid']);
    expect(finishToColorSystems('sealed-concrete')).toEqual(['solid']);
    expect(finishToColorSystems('overlay')).toEqual(['solid']);
  });
  it('defaults to solid for unknown', () => {
    expect(finishToColorSystems('unknown-xyz')).toEqual(['solid']);
  });
});

describe('compilePrompt', () => {
  const baseFinish = {
    name: 'Flake Epoxy',
    surface_description: 'decorative vinyl flakes',
    sheen: 'satin',
    installation_details: ['broadcast flakes'],
    avoid: ['cartoonish rendering'],
  };
  const baseEnv = {
    name: 'Garage',
    scene_details: 'two-car garage',
    lighting_options: ['natural daylight'],
  };

  it('substitutes finish, environment, and color placeholders', () => {
    const prompt = compilePrompt({
      finish: baseFinish,
      environment: baseEnv,
      camera: { image: '24mm wide shot' },
      colorName: 'Graphite',
      hex: '#3A3A3A',
    });
    expect(prompt).toContain('Flake Epoxy');
    expect(prompt).toContain('Garage');
    expect(prompt).toContain('Graphite (#3A3A3A)');
    expect(prompt).toContain('24mm wide shot');
    expect(prompt).toContain('natural daylight');
    expect(prompt).toContain('broadcast flakes');
    expect(prompt).toContain('AI-generated project concept');
    expect(prompt).toContain('cartoonish rendering');
    expect(prompt).not.toContain('{finishName}');
    expect(prompt).not.toContain('{environmentName}');
  });

  it('falls back to natural tone when no color provided', () => {
    const prompt = compilePrompt({
      finish: { name: 'Polished Concrete' },
      environment: { name: 'Showroom' },
    });
    expect(prompt).toContain('natural material tone');
    expect(prompt).toContain('Polished Concrete');
    expect(prompt).toContain('Showroom');
  });

  it('uses first lighting option and default camera when missing', () => {
    const prompt = compilePrompt({
      finish: { name: 'Solid Epoxy' },
      environment: { name: 'Basement', lighting_options: ['recessed warm'] },
    });
    expect(prompt).toContain('recessed warm');
    expect(prompt).toContain(CAMERA_LIBRARY[0].image);
  });
});

describe('CAMERA_LIBRARY', () => {
  it('has 9 camera presets with id, name, and image', () => {
    expect(CAMERA_LIBRARY).toHaveLength(9);
    expect(CAMERA_LIBRARY.every((c) => c.id && c.name && c.image)).toBe(true);
  });
});