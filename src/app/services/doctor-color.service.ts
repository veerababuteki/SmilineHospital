import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DoctorColorService {
  // Color definitions with corresponding light backgrounds
  private colorDefinitions: Record<string, { color: string, background: string }> = {
    red: { color: '#dc3545', background: '#f8d7da' },
    green: { color: '#28a745', background: '#d4edda' },
    blue: { color: '#0052cc', background: '#d0e2ff' },
    purple: { color: '#6f42c1', background: '#e6d8f5' },
    pink: { color: '#e83e8c', background: '#fce4ec' },
    brown: { color: '#8B4513', background: '#efdfd0' },
    gray: { color: '#495057', background: '#e2e3e5' },
    teal: { color: '#008080', background: '#d0f0f0' },
    cyan: { color: '#0097a7', background: '#d0faff' },
    magenta: { color: '#d63384', background: '#f8d0e5' },
    indigo: { color: '#6610f2', background: '#e0e0ff' },
    violet: { color: '#7b1fa2', background: '#f0e6f9' },
    maroon: { color: '#800000', background: '#f8d7da' },
    navy: { color: '#000080', background: '#d6e0f5' },
    crimson: { color: '#dc143c', background: '#f9d6dc' },
    darkgreen: { color: '#006400', background: '#d4f5d4' },
    darkblue: { color: '#00008b', background: '#d6e6ff' },
    darkred: { color: '#8b0000', background: '#f3d6d6' },
    darkorange: { color: '#ff8c00', background: '#ffe5b4' },
    darkpurple: { color: '#48186a', background: '#e6ccf2' },
    darkbrown: { color: '#5c4033', background: '#ecdcd3' },
    darkgray: { color: '#3c4043', background: '#e8e8e8' },
    darkteal: { color: '#004d40', background: '#ccf2f2' },
    darkcyan: { color: '#008b8b', background: '#d0fafa' },
    darkmagenta: { color: '#8b008b', background: '#f2d6f2' },
    darkindigo: { color: '#3949ab', background: '#e6ecff' },
    darkviolet: { color: '#9400d3', background: '#ecd8f7' },
    darkmaroon: { color: '#640000', background: '#f2d6d6' },
    darknavy: { color: '#000038', background: '#e0e6ff' },
    olive: { color: '#808000', background: '#e6e6cc' },
    forestgreen: { color: '#228b22', background: '#d2f5d2' },
    royalblue: { color: '#4169e1', background: '#e0ecff' },
    mediumblue: { color: '#0000cd', background: '#d0e2ff' },
    firebrick: { color: '#b22222', background: '#f6d0d0' },
    chocolate: { color: '#d2691e', background: '#ffe0cc' },
    saddlebrown: { color: '#8b4513', background: '#f0e0d0' },
    midnightblue: { color: '#191970', background: '#d8e0f5' },
    darkslategray: { color: '#2f4f4f', background: '#d7e4e4' },
    darkslateblue: { color: '#483d8b', background: '#ddd7ff' },
    darkgoldenrod: { color: '#b8860b', background: '#ffeab5' },
    sienna: { color: '#a0522d', background: '#f3e0d0' },
    rosybrown: { color: '#bc8f8f', background: '#f2dada' },
    steelblue: { color: '#4682b4', background: '#d6eaf8' },
    dimgray: { color: '#696969', background: '#e6e6e6' },
    cadetblue: { color: '#5f9ea0', background: '#daf0f0' },
    tomato: { color: '#ff6347', background: '#ffebe6' },
    orangered: { color: '#ff4500', background: '#ffd6cc' },
    seagreen: { color: '#2e8b57', background: '#d4f0d4' },
    darkkhaki: { color: '#bdb76b', background: '#f0e6c0' },
    slateblue: { color: '#6a5acd', background: '#e0dfff' },
    mediumorchid: { color: '#ba55d3', background: '#f2d6f9' },
    darkturquoise: { color: '#00ced1', background: '#d0f9f9' },
    mediumseagreen: { color: '#3cb371', background: '#d2f8e0' },
    goldenrod: { color: '#daa520', background: '#ffefcc' },
    dodgerblue: { color: '#1e90ff', background: '#d6f0ff' },
    coral: { color: '#ff7f50', background: '#ffe3d5' },
    mediumvioletred: { color: '#c71585', background: '#f9d0e6' },
    indianred: { color: '#cd5c5c', background: '#f9d6d6' },
    peru: { color: '#cd853f', background: '#f3e3d3' },
    deeppink: { color: '#ff1493', background: '#ffd1eb' },
    darkseagreen: { color: '#8fbc8f', background: '#e6f5e6' },
    mediumslateblue: { color: '#7b68ee', background: '#e0e0ff' },
    darkolivegreen: { color: '#556b2f', background: '#e3ecd3' },
    olivedrab: { color: '#6b8e23', background: '#e3f0d0' },
    blueviolet: { color: '#8a2be2', background: '#e6dcff' },
    slategray: { color: '#708090', background: '#e0e0e0' },
    mediumturquoise: { color: '#48d1cc', background: '#ccf5f5' },
    limegreen: { color: '#32cd32', background: '#ddfcd7' },
    mediumaquamarine: { color: '#66cdaa', background: '#d4fdf4' },
    deepskyblue: { color: '#00bfff', background: '#ccf2ff' },
    mediumspringgreen: { color: '#00fa9a', background: '#ccffe6' },
    black: { color: '#000000', background: '#f0f0f0' },
    darkorchid: { color: '#9932cc', background: '#f0d6f9' },
    rebeccapurple: { color: '#663399', background: '#ead6ff' }
  };

  private colorClasses = Object.keys(this.colorDefinitions);
  private doctorColorMap = new Map<string, string>();

  constructor() {
    this.injectColorStyles();
  }

  getColorForDoctor(doctorId: string): string {
    if (this.doctorColorMap.has(doctorId)) {
      return this.doctorColorMap.get(doctorId)!;
    }

    const colorIndex = this.doctorColorMap.size % this.colorClasses.length;
    const colorClass = this.colorClasses[colorIndex];

    this.doctorColorMap.set(doctorId, colorClass);
    return colorClass;
  }

  private injectColorStyles(): void {
    const styleElement = document.createElement('style');
    let styleContent = '';

    Object.entries(this.colorDefinitions).forEach(([name, def]) => {
      styleContent += `
        .status-dot.${name} {
          background-color: ${def.color};
        }
        .status-bg.${name} {
          background-color: ${def.background};
        }
        /* Ensure calendar events use the exact same color system */
        ::ng-deep .fc-event.doctor-bg-${name} {
          background-color: ${def.background} !important;
          border-left-color: ${def.color} !important;
        }
      `;
    });

    styleElement.textContent = styleContent;
    document.head.appendChild(styleElement);
  }

  getHexCode(colorName: string): string {
    return this.colorDefinitions[colorName]?.color || '#000000';
  }

  getBackgroundHex(colorName: string): string {
    return this.colorDefinitions[colorName]?.background || '#ffffff';
  }
}

