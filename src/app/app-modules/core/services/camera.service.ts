import { Injectable, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DOCUMENT } from '@angular/common';
import { Observable } from 'rxjs';
import { CameraDialogComponent } from '../components/camera-dialog/camera-dialog.component';

@Injectable()
export class CameraService {
  constructor(
    private dialog: MatDialog,
    @Inject(DOCUMENT) doc: any,
  ) {}

  public capture(titleAlign = 'center'): Observable<any> {
    const config = new MatDialogConfig();
    const dialogRef = this.dialog.open(CameraDialogComponent, config);
    dialogRef.componentInstance.capture = true;
    dialogRef.componentInstance.imageCode = false;
    return dialogRef.afterClosed();
  }

  public viewImage(benImageCode: string, titleAlign = 'center'): void {
    const config = new MatDialogConfig();
    const dialogRef = this.dialog.open(CameraDialogComponent, config);
    dialogRef.componentInstance.capture = false;
    dialogRef.componentInstance.imageCode = benImageCode;
  }

  public annotate(
    image: string,
    points: any,
    currentLanguage: any,
    titleAlign = 'center',
  ): Observable<any> {
    const dialogRef = this.dialog.open(CameraDialogComponent, {
      width: '80%',
    });
    dialogRef.componentInstance.capture = false;
    dialogRef.componentInstance.imageCode = false;
    dialogRef.componentInstance.annotate = image;
    dialogRef.componentInstance.current_language_set = currentLanguage;
    dialogRef.componentInstance.availablePoints = points;
    return dialogRef.afterClosed();
  }

  public ViewGraph(graph: any): void {
    const dialogRef = this.dialog.open(CameraDialogComponent, {
      width: '80%',
    });
    dialogRef.componentInstance.capture = false;
    dialogRef.componentInstance.imageCode = false;
    dialogRef.componentInstance.annotate = false;
    dialogRef.componentInstance.availablePoints = false;
    dialogRef.componentInstance.graph = graph;
  }
}
