import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="signature-pad-container">
      <div class="signature-header">
        <h4>{{ title || 'Digital Signature' }}</h4>
        <div class="signature-actions">
          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            (click)="clearSignature()"
            [disabled]="!hasSignature">
            Clear
          </button>
          <button 
            type="button" 
            class="btn btn-primary btn-sm" 
            (click)="uploadSignature()"
            [disabled]="hasSignature">
            Upload Image
          </button>
        </div>
      </div>
      
      <div class="signature-area">
        <canvas 
          #signatureCanvas 
          class="signature-canvas"
          (mousedown)="onMouseDown($event)"
          (mousemove)="onMouseMove($event)"
          (mouseup)="onMouseUp()"
          (mouseleave)="onMouseUp()"
          (touchstart)="onTouchStart($event)"
          (touchmove)="onTouchMove($event)"
          (touchend)="onTouchEnd()">
        </canvas>
        
        <div class="signature-placeholder" *ngIf="!hasSignature">
          <p>Draw your signature here or upload an image</p>
        </div>
      </div>
      
      <input 
        type="file" 
        #fileInput 
        accept="image/*" 
        style="display: none;"
        (change)="onFileSelected($event)">
    </div>
  `,
  styles: [`
    .signature-pad-container {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      background: white;
    }
    
    .signature-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .signature-header h4 {
      margin: 0;
      color: #333;
      font-size: 14px;
      font-weight: 600;
    }
    
    .signature-actions {
      display: flex;
      gap: 8px;
    }
    
    .signature-area {
      position: relative;
      border: 2px dashed #ccc;
      border-radius: 4px;
      background: #fafafa;
      min-height: 120px;
    }
    
    .signature-canvas {
      width: 100%;
      height: 120px;
      cursor: crosshair;
      background: transparent;
      position: relative;
      z-index: 2;
    }
    
    .signature-placeholder {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #999;
      font-size: 14px;
      z-index: 1;
    }
    
    .signature-placeholder p {
      margin: 0;
    }
    
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 11px;
    }
  `]
})
export class SignaturePadComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  
  @Input() title: string = '';
  @Input() width: number = 300;  // Reduced from 400 for smaller file sizes
  @Input() height: number = 100; // Reduced from 120 for smaller file sizes
  @Input() lineWidth: number = 2;
  @Input() strokeStyle: string = '#000000';
  
  @Output() signatureChange = new EventEmitter<string | null>();
  
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  
  hasSignature: boolean = false;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  private initCanvas(): void {
    this.canvas = this.signatureCanvas.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Set canvas size
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Set drawing styles
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  onMouseDown(event: MouseEvent): void {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = event.clientX - rect.left;
    this.lastY = event.clientY - rect.top;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    
    this.drawLine(this.lastX, this.lastY, currentX, currentY);
    
    this.lastX = currentX;
    this.lastY = currentY;
  }

  onMouseUp(): void {
    this.isDrawing = false;
    this.checkSignature();
  }

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.lastX = touch.clientX - rect.left;
      this.lastY = touch.clientY - rect.top;
      this.isDrawing = true;
    }
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing || event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    
    this.drawLine(this.lastX, this.lastY, currentX, currentY);
    
    this.lastX = currentX;
    this.lastY = currentY;
  }

  onTouchEnd(): void {
    this.isDrawing = false;
    this.checkSignature();
  }

  private drawLine(fromX: number, fromY: number, toX: number, toY: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
  }

  private checkSignature(): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    let hasPixels = false;
    
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        hasPixels = true;
        break;
      }
    }
    
    this.hasSignature = hasPixels;
    this.emitSignature();
  }

  clearSignature(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasSignature = false;
    this.emitSignature();
  }

  uploadSignature(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          this.drawImageOnCanvas(img);
          this.checkSignature();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    
    // Reset file input
    event.target.value = '';
  }

  private drawImageOnCanvas(img: HTMLImageElement): void {
    // Clear canvas first
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate aspect ratio to fit image properly
    const imgAspect = img.width / img.height;
    const canvasAspect = this.canvas.width / this.canvas.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imgAspect > canvasAspect) {
      // Image is wider than canvas
      drawWidth = this.canvas.width;
      drawHeight = this.canvas.width / imgAspect;
      offsetX = 0;
      offsetY = (this.canvas.height - drawHeight) / 2;
    } else {
      // Image is taller than canvas
      drawHeight = this.canvas.height;
      drawWidth = this.canvas.height * imgAspect;
      offsetX = (this.canvas.width - drawWidth) / 2;
      offsetY = 0;
    }
    
    this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  getSignatureDataUrl(): string | null {
    if (!this.hasSignature) return null;
    // Use PNG format for better signature quality and visibility
    return this.canvas.toDataURL('image/png');
  }

  private emitSignature(): void {
    const signatureData = this.hasSignature ? this.getSignatureDataUrl() : null;
    this.signatureChange.emit(signatureData);
  }

  // Method to set signature from external source (for loading saved signatures)
  setSignature(dataUrl: string): void {
    const img = new Image();
    img.onload = () => {
      this.drawImageOnCanvas(img);
      this.hasSignature = true;
      this.emitSignature();
    };
    img.src = dataUrl;
  }
}

