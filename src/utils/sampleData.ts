/**
 * Realistic messy sample datasets for immediate testing and demonstration
 */

export const SAMPLE_MESSY_CRM: any[][] = [
  ['*** ACME GLOBAL ENTERPRISE - CRM EXPORT (UNVERIFIED) ***', '', '', '', '', '', '', ''],
  ['Confidential - Exported by SysAdmin on 2024-11-14. Do not distribute.', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  [
    '  Cust_ID  ',
    ' Full   Name ',
    'Email_Address ',
    ' Phone Number ',
    'Registration Date',
    'Total_Spend ($)',
    ' Is_Active ',
    'Notes / Remarks'
  ],
  ['CUST-1001', '  Sarah   Jenkins ', 'sarah.j@TECHCORP.COM  ', '(555) 234-8901', '2023-01-15', '$2,450.00', 'YES', 'VIP client  '],
  ['CUST-1002', 'michael chang', 'mchang@ApexSolutions.org', '555.345.6789', '01/18/2023', ' 1,890.50 ', 'true', 'Referred by CUST-1001'],
  ['CUST-1003', 'Dr. Evelyn Reed', 'EVELYN.REED@medcenter.edu', '555-456-7890', '15-02-2023', '$3,120.00', '1', 'Requires paper receipts'],
  ['CUST-1001', '  Sarah Jenkins ', 'sarah.j@techcorp.com', '5552348901', '2023-01-15', '$2,450.00', 'yes', 'VIP client'], // Exact duplicate logically
  ['CUST-1004', 'James   "Jim"  O\'Connor', 'j.oconnor@domain.io', '+1 (555) 567-8901', 'Mar 12, 2023', '$950.00', 'Y', ''],
  ['', '', '', '', '', '', '', ''], // empty row
  ['CUST-1005', 'MARIA GARCIA', 'm.garcia@globalfirm.es', '555-678-9012', '2023/04/05', '(420.00)', 'N', 'Chargeback disputed'], // Negative spend in parens
  ['CUST-1006', 'David Miller', 'david.miller@startup.co ', '555 789 0123', '2023-05-22', '0.00', 'no', 'Trial account'],
  ['CUST-1007', 'David Miler', 'david.miller@startup.co', '555-789-0123', '2023-05-22', '$0.00', 'false', 'Trial account duplicate'], // Near duplicate / fuzzy
  ['CUST-1008', 'Lisa Wang  ', 'lisa.w@designstudio.net', '555-890-1234', 'June 30, 2023', 'USD 4,800.00', 'YES', 'Enterprise tier'],
  ['CUST-1009', '  Robert "Bob" Chen', 'bchen@logistics.com', '555.901.2345', '2023-07-14', 'N/A', '0', 'Pending contract'],
  ['CUST-1010', 'Elena Rostova', 'elena@moscowtrading.ru', '+1-555-012-3456', '2023-08-01', '$12,400.95', 'TRUE', 'Global partner'],
  ['CUST-1011', 'Lucas Silva', 'lucas.silva@rio-tech.br', '5551234567', '2023-09-19', 'null', 'yes', 'Awaiting tax clearance'],
  ['CUST-1012', 'Anna-Marie Dupont', '  ANNA@PARISDESIGN.FR  ', '(555) 234-5678', '19/10/2023', '€ 1,650.00', 'y', 'Custom invoice'],
  ['CUST-1002', 'michael chang', 'mchang@ApexSolutions.org', '555.345.6789', '01/18/2023', ' 1,890.50 ', 'true', 'Referred by CUST-1001'], // exact duplicate row
  ['CUST-1013', '  Marcus Thorne ', 'mthorne@aerospace.org', '555-345-6780', '2023-11-03', '$7,350.25', 'TRUE', ''],
  ['', '', '', '', '', '', '', ''],
  ['CUST-1014', 'Chloe Bennett', 'chloe.b@fashionhub.com', '555-456-7891', '2023-12-12', '1250', '1', 'Quarterly retainer']
];

export const SAMPLE_MESSY_INVENTORY: any[][] = [
  ['SKU_CODE', 'Product Title', 'CATEGORY', 'Qty_In_Stock', 'Unit_Cost ($)', 'Retail Price', 'Discontinued?', 'Supplier Name'],
  ['sku-101', '  Ergonomic Wireless Mouse  ', 'electronics', '45', '$14.50', '29.99', 'no', 'TechPro Supplies '],
  ['SKU-102', 'MECHANICAL GAMING KEYBOARD (RGB)', 'ELECTRONICS', '12', '$42.00', '$89.99', 'FALSE', 'TechPro Supplies'],
  ['SKU-103', 'usb-c fast charging cable (2m)', 'accessories', '250', '$2.10', '$12.99', 'N', 'CableWorks Direct'],
  ['SKU-104', '4K Ultra-HD Monitor 27"', 'Electronics', '0', ' $145.00 ', '$299.99', 'yes', 'VisionDisplay Co.'],
  ['SKU-101', 'Ergonomic Wireless Mouse', 'electronics', '45', '$14.50', '29.99', 'no', 'TechPro Supplies'], // duplicate SKU
  ['SKU-105', 'Noise-Cancelling Headphones Pro', 'Audio', '34', '$68.50', '$149.00', '0', 'AudioTech Labs'],
  ['SKU-106', 'Bluetooth Travel Speaker', 'audio', 'N/A', '$18.25', '$39.95', 'no', 'AudioTech Labs'],
  ['SKU-107', 'Laptop Stand Aluminum Adjustable', 'Office Accessories', '88', '$12.00', '24.99', 'FALSE', 'ErgoWorks Ltd'],
  ['SKU-108', 'Dual Monitor Arm Desk Mount', 'office accessories', '15', '$28.00', '$59.99', 'no', 'ErgoWorks Ltd '],
  ['SKU-109', 'Heavy Duty Surge Protector (8-Outlet)', 'accessories', '110', '$8.50', '$19.99', 'NO', 'CableWorks Direct'],
  ['', '', '', '', '', '', '', ''],
  ['SKU-110', 'Smart Desk LED Lamp with Wireless Charger', 'Home & Office', '23', '$22.00', '$49.99', 'false', 'LuminaTech']
];

export const SAMPLE_MESSY_FINANCIAL: any[][] = [
  ['--- ACME FINANCE DEPT: OUTSTANDING INVOICES ---', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['INV_NUMBER', 'Customer / Entity', 'Country Code', 'Invoice Date', 'Gross Amount', 'Status'],
  ['INV-2024-001', 'Acme Nordics AB', 'SE', '2024-01-15', '€ 12,500.00', 'PAID'],
  ['INV-2024-002', 'Bavaria Motors Gmbh', 'de', '15/01/2024', '45,200.50 €', 'paid'],
  ['INV-2024-003', 'Tokyo Cloud Systems KK', 'JP', '2024/02/01', '¥ 1,450,000', 'PENDING'],
  ['INV-2024-004', 'London Financial Group', 'uk', '01-02-2024', '£ 8,900.00', 'PAID'],
  ['INV-2024-005', 'Toronto Retail Inc.', 'CA', 'Feb 14, 2024', '$ 3,450.75', 'OVERDUE'],
  ['INV-2024-002', 'Bavaria Motors Gmbh', 'DE', '2024-01-15', '45,200.50', 'PAID'], // duplicate
  ['INV-2024-006', 'São Paulo Logistics SA', 'br', '2024-02-28', 'R$ 18,300.00', 'pending'],
  ['INV-2024-007', 'Zurich Asset Management', 'CH', '2024-03-10', 'CHF 9,800.00', 'PAID']
];
