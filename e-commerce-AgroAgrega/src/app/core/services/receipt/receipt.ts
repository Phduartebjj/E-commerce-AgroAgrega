import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

import { OrderModel } from '@models/order';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  generateReceipt(order: OrderModel): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    let y = 20;

    // =========================
    // CABEÇALHO
    // =========================

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('AGROAGREGA', 20, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Comprovante de pedido', 20, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.text(`Pedido #${order.id}`, pageWidth - 20, y, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    doc.text(this.formatDate(order.createdAt), pageWidth - 20, y + 6, {
      align: 'right',
    });

    y += 18;

    this.drawLine(doc, y);

    // =========================
    // STATUS E PAGAMENTO
    // =========================

    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Informações do pedido', 20, y);

    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text(`Status: ${order.status}`, 20, y);

    doc.text(`Pagamento: ${order.paymentMethod}`, pageWidth - 20, y, { align: 'right' });

    // =========================
    // ENTREGA
    // =========================

    y += 14;

    this.drawSectionTitle(doc, 'Dados de entrega', y);

    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(order.address.fullName, 20, y);

    y += 6;

    doc.setFont('helvetica', 'normal');

    doc.text(`${order.address.address}, ${order.address.number}`, 20, y);

    y += 5;

    if (order.address.complement) {
      doc.text(`Complemento: ${order.address.complement}`, 20, y);

      y += 5;
    }

    doc.text(`${order.address.neighborhood} - ${order.address.city}/${order.address.state}`, 20, y);

    y += 5;

    doc.text(`CEP: ${order.address.cep}`, 20, y);

    // =========================
    // ITENS
    // =========================

    y += 14;

    this.drawLine(doc, y);

    y += 12;

    this.drawSectionTitle(doc, 'Itens do pedido', y);

    y += 9;

    // Cabeçalho da tabela
    doc.setFillColor(240, 244, 241);
    doc.rect(20, y - 5, pageWidth - 40, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    doc.text('Produto', 23, y);
    doc.text('Qtd.', 125, y);
    doc.text('Preço unit.', 145, y);
    doc.text('Subtotal', pageWidth - 23, y, {
      align: 'right',
    });

    y += 9;

    doc.setFont('helvetica', 'normal');

    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];

      doc.text(this.truncateText(item.name, 48), 23, y);
      doc.text(String(item.quantity), 125, y);
      doc.text(this.formatMoney(item.price), 145, y);
      doc.text(this.formatMoney(item.subtotal), pageWidth - 23, y, { align: 'right' });

      if (i < order.items.length - 1) {
        const lineY = y + 4;

        doc.setDrawColor(230, 235, 231);
        doc.setLineWidth(0.2);
        doc.line(20, lineY, pageWidth - 20, lineY);
      }

      y += 10;
    }

    // =========================
    // RESUMO
    // =========================

    y += 6;

    this.drawSectionTitle(doc, 'Resumo do pagamento', y);

    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    this.drawSummaryLine(doc, 'Subtotal', this.formatMoney(order.subtotal), y);

    y += 7;

    this.drawSummaryLine(doc, 'Desconto', `- ${this.formatMoney(order.discount)}`, y);

    y += 7;

    this.drawSummaryLine(doc, 'Frete', this.formatMoney(order.shipping), y);

    y += 5;

    this.drawLine(doc, y);

    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);

    doc.text('TOTAL', 20, y);

    doc.text(this.formatMoney(order.total), pageWidth - 20, y, { align: 'right' });

    // =========================
    // RODAPÉ
    // =========================

    y += 16;

    this.drawLine(doc, y);

    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text(
      'Este documento é um comprovante do pedido realizado na plataforma AgroAgrega.',
      pageWidth / 2,
      y,
      { align: 'center' },
    );

    y += 5;

    doc.text('A AgroAgrega agradece pela preferência.', pageWidth / 2, y, { align: 'center' });

    doc.save(`comprovante-pedido-${order.id}.pdf`);
  }

  private drawSectionTitle(doc: jsPDF, title: string, y: number): void {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, 20, y);
  }

  private drawLine(doc: jsPDF, y: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setDrawColor(210, 217, 212);
    doc.line(20, y, pageWidth - 20, y);
  }

  private drawSummaryLine(doc: jsPDF, label: string, value: string, y: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.text(label, 20, y);

    doc.text(value, pageWidth - 20, y, {
      align: 'right',
    });
  }

  private formatMoney(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.substring(0, maxLength - 3)}...`;
  }
}
