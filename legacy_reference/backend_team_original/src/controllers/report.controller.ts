import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';

// FLOW START: Reports Controller (EN)
// จุดเริ่มต้น: Controller ของ Reports (TH)

export const getReports = async (req: TenantRequest, res: Response) => {
  const reports = await prisma.report.findMany({
    where: { tenantId: req.tenantId! },
    include: { createdByUser: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ reports });
};

export const getReportById = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const report = await prisma.report.findFirst({
    where: { id, tenantId: req.tenantId! },
  });

  res.json({ report });
};

export const createReport = async (req: TenantRequest, res: Response) => {
  const report = await prisma.report.create({
    data: {
      ...req.body,
      tenantId: req.tenantId!,
      createdBy: req.userId,
    },
  });

  res.status(201).json({ report });
};

export const updateReport = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const report = await prisma.report.updateMany({
    where: { id, tenantId: req.tenantId! },
    data: req.body,
  });

  res.json({ report });
};

export const deleteReport = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  await prisma.report.deleteMany({
    where: { id, tenantId: req.tenantId! },
  });

  res.json({ message: 'Report deleted successfully' });
};

export const generateReport = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const report = await prisma.report.findFirst({
    where: { id, tenantId: req.tenantId! },
  });

  if (!report) {
    throw new Error('Report not found');
  }

  // Get metrics based on report filters
  const where: any = {
    tenantId: req.tenantId!,
  };

  if (report.startDate && report.endDate) {
    where.date = {
      gte: report.startDate,
      lte: report.endDate,
    };
  }

  const metrics = await prisma.metric.findMany({
    where,
    include: {
      campaign: { select: { name: true, platform: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Aggregate data
  const aggregated = metrics.reduce(
    (acc: any, metric: any) => {
      acc.totalImpressions += metric.impressions || 0;
      acc.totalClicks += metric.clicks || 0;
      acc.totalConversions += metric.conversions || 0;
      acc.totalSpend += Number(metric.spend) || 0;
      acc.totalRevenue += Number(metric.revenue) || 0;
      return acc;
    },
    {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
    },
  );

  // Update report with generated data
  const baseFilters =
    report.filters && typeof report.filters === 'object' ? (report.filters as Record<string, any>) : {};

  const updatedReport = await prisma.report.update({
    where: { id },
    data: {
      filters: {
        ...baseFilters,
        generatedAt: new Date().toISOString(),
        metricsCount: metrics.length,
        aggregated,
      },
    },
  });

  res.json({
    message: 'Report generated successfully',
    report: updatedReport,
    summary: {
      metricsCount: metrics.length,
      ...aggregated,
    },
  });
};

export const downloadReport = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { format = 'pdf' } = req.query;

  const report = await prisma.report.findFirst({
    where: { id, tenantId: req.tenantId! },
  });

  if (!report) {
    throw new Error('Report not found');
  }

  // Get metrics
  const where: any = { tenantId: req.tenantId! };
  if (report.startDate && report.endDate) {
    where.date = { gte: report.startDate, lte: report.endDate };
  }

  const metrics = await prisma.metric.findMany({
    where,
    include: { campaign: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });

  if (format === 'csv') {
    const csv = require('csv-writer');
    const csvWriter = csv.createObjectCsvStringifier({
      header: [
        { id: 'date', title: 'Date' },
        { id: 'campaign', title: 'Campaign' },
        { id: 'platform', title: 'Platform' },
        { id: 'impressions', title: 'Impressions' },
        { id: 'clicks', title: 'Clicks' },
        { id: 'conversions', title: 'Conversions' },
        { id: 'spend', title: 'Spend' },
        { id: 'revenue', title: 'Revenue' },
      ],
    });

    const records = metrics.map((m: any) => ({
      date: m.date.toISOString().split('T')[0],
      campaign: m.campaign?.name || 'N/A',
      platform: m.platform,
      impressions: m.impressions,
      clicks: m.clicks,
      conversions: m.conversions,
      spend: Number(m.spend) || 0,
      revenue: Number(m.revenue) || 0,
    }));

    const csvContent = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${id}.csv`);
    res.send(csvContent);
  } else if (format === 'excel') {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Campaign', key: 'campaign', width: 30 },
      { header: 'Platform', key: 'platform', width: 15 },
      { header: 'Impressions', key: 'impressions', width: 12 },
      { header: 'Clicks', key: 'clicks', width: 10 },
      { header: 'Conversions', key: 'conversions', width: 12 },
      { header: 'Spend', key: 'spend', width: 12 },
      { header: 'Revenue', key: 'revenue', width: 12 },
    ];

    metrics.forEach((m: any) => {
      worksheet.addRow({
        date: m.date.toISOString().split('T')[0],
        campaign: m.campaign?.name || 'N/A',
        platform: m.platform,
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        spend: Number(m.spend) || 0,
        revenue: Number(m.revenue) || 0,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=report-${id}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } else {
    // PDF format
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${id}.pdf`);

    doc.pipe(res);
    doc.fontSize(20).text('RGA Dashboard Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report: ${report.name}`, { align: 'left' });
    doc.text(
      `Period: ${report.startDate?.toISOString().split('T')[0]} to ${report.endDate?.toISOString().split('T')[0]}`,
    );
    doc.moveDown();

    // Summary
    const total = metrics.reduce(
      (acc: any, m: any) => ({
        impressions: acc.impressions + (m.impressions || 0),
        clicks: acc.clicks + (m.clicks || 0),
        spend: acc.spend + (Number(m.spend) || 0),
        revenue: acc.revenue + (Number(m.revenue) || 0),
      }),
      { impressions: 0, clicks: 0, spend: 0, revenue: 0 },
    );

    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(10).text(`Total Impressions: ${total.impressions}`);
    doc.text(`Total Clicks: ${total.clicks}`);
    doc.text(`Total Spend: ${total.spend.toFixed(2)}`);
    doc.text(`Total Revenue: ${total.revenue.toFixed(2)}`);
    doc.moveDown();

    // Metrics table
    doc.fontSize(12).text('Metrics', { underline: true });
    doc.moveDown(0.5);

    let y = doc.y;
    doc.fontSize(8);
    metrics.slice(0, 50).forEach((m: any, i: number) => {
      if (i > 0 && i % 20 === 0) {
        doc.addPage();
        y = 50;
      }
      doc.text(
        `${m.date.toISOString().split('T')[0]} | ${m.platform} | Impressions: ${m.impressions} | Clicks: ${m.clicks}`,
        50,
        y + (i % 20) * 15,
      );
    });

    doc.end();
  }
};

// FLOW END: Reports Controller (EN)
// จุดสิ้นสุด: Controller ของ Reports (TH)
