import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

// Register fonts for better typography
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2",
      fontWeight: "bold",
    },
  ],
});

// Styles similar to the attached PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#000000",
    textAlign: "left",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 25,
    color: "#000000",
  },
  heading1: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
    color: "#000000",
  },
  heading2: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 15,
    color: "#000000",
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: "justify",
    lineHeight: 1.6,
  },
  boldText: {
    fontWeight: "bold",
  },
  italicText: {
    fontStyle: "italic",
  },
  codeBlock: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    marginVertical: 10,
    fontFamily: "Courier",
    fontSize: 9,
    borderRadius: 4,
    border: "1px solid #e9ecef",
  },
  inlineCode: {
    backgroundColor: "#f8f9fa",
    padding: 2,
    fontFamily: "Courier",
    fontSize: 9,
    borderRadius: 2,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginVertical: 15,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
  },
  tableCol: {
    flex: 1,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  tableCell: {
    margin: "auto",
    padding: 8,
    fontSize: 9,
    textAlign: "left",
  },
  tableHeaderCell: {
    margin: "auto",
    padding: 8,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "left",
  },
  listItem: {
    fontSize: 10,
    marginBottom: 6,
    marginLeft: 20,
    lineHeight: 1.4,
  },
  listItemBullet: {
    position: "absolute",
    left: -15,
    width: 10,
  },
  separator: {
    marginVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  note: {
    backgroundColor: "#e7f3ff",
    padding: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0066cc",
    fontSize: 10,
    lineHeight: 1.5,
  },
  faq: {
    marginVertical: 8,
  },
  faqQuestion: {
    fontWeight: "bold",
    fontSize: 10,
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 10,
    marginBottom: 8,
    marginLeft: 10,
  },
});

interface MarkdownSection {
  type:
    | "title"
    | "subtitle"
    | "heading1"
    | "heading2"
    | "paragraph"
    | "code"
    | "list"
    | "table"
    | "separator"
    | "note";
  content: string;
  items?: string[];
  tableData?: string[][];
}

const parseMarkdownContent = (markdown: string): MarkdownSection[] => {
  const lines = markdown.split("\n");
  const sections: MarkdownSection[] = [];
  let currentCodeBlock = "";
  let inCodeBlock = false;
  let currentTable: string[][] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Handle code blocks
    if (trimmedLine === "```" || trimmedLine.startsWith("```")) {
      if (inCodeBlock) {
        sections.push({ type: "code", content: currentCodeBlock.trim() });
        currentCodeBlock = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeBlock += line + "\n";
      continue;
    }

    // Handle tables
    if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }

      const cells = trimmedLine
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (!cells.every((cell) => cell.match(/^-+$/))) {
        // Skip separator rows
        currentTable.push(cells);
      }
      continue;
    } else if (inTable) {
      sections.push({ type: "table", content: "", tableData: currentTable });
      currentTable = [];
      inTable = false;
    }

    // Handle different markdown elements
    if (trimmedLine === "---") {
      sections.push({ type: "separator", content: "" });
    } else if (trimmedLine.startsWith("# ")) {
      sections.push({ type: "title", content: trimmedLine.substring(2) });
    } else if (trimmedLine.startsWith("## ")) {
      sections.push({ type: "subtitle", content: trimmedLine.substring(3) });
    } else if (trimmedLine.startsWith("### ")) {
      sections.push({ type: "heading1", content: trimmedLine.substring(4) });
    } else if (trimmedLine.startsWith("#### ")) {
      sections.push({ type: "heading2", content: trimmedLine.substring(5) });
    } else if (trimmedLine.startsWith("> ")) {
      // Handle multi-line notes
      let noteContent = trimmedLine.substring(2);
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("> ")) {
        i++;
        noteContent += " " + lines[i].trim().substring(2);
      }
      sections.push({ type: "note", content: noteContent });
    } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      // Collect all consecutive list items
      const listItems = [trimmedLine.substring(2)];
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith("- ") || nextLine.startsWith("* ")) {
          i++;
          listItems.push(nextLine.substring(2));
        } else if (nextLine.startsWith("  ") && listItems.length > 0) {
          // Handle sub-items or continued lines
          i++;
          listItems[listItems.length - 1] += " " + nextLine.trim();
        } else {
          break;
        }
      }
      sections.push({ type: "list", content: "", items: listItems });
    } else if (trimmedLine.length > 0) {
      sections.push({ type: "paragraph", content: trimmedLine });
    }
  }

  // Handle remaining table if exists
  if (inTable && currentTable.length > 0) {
    sections.push({ type: "table", content: "", tableData: currentTable });
  }

  return sections;
};

const renderTextWithFormatting = (text: string) => {
  const parts = [];
  let currentIndex = 0;

  // Create a combined regex for all formatting
  const formatRegex = /(\*\*(.*?)\*\*|`(.*?)`|_(.*?)_|\[(.*?)\]\((.*?)\))/g;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(
        <Text key={`text-${currentIndex}`}>
          {text.substring(currentIndex, match.index)}
        </Text>
      );
    }

    if (match[1].startsWith("**")) {
      // Bold text **text**
      parts.push(
        <Text key={`bold-${match.index}`} style={styles.boldText}>
          {match[2]}
        </Text>
      );
    } else if (match[1].startsWith("`")) {
      // Inline code `code`
      parts.push(
        <Text key={`code-${match.index}`} style={styles.inlineCode}>
          {match[3]}
        </Text>
      );
    } else if (match[1].startsWith("_")) {
      // Italic text _text_
      parts.push(
        <Text key={`italic-${match.index}`} style={styles.italicText}>
          {match[4]}
        </Text>
      );
    } else if (match[1].startsWith("[")) {
      // Links [text](url) - just show as text for PDF
      parts.push(
        <Text key={`link-${match.index}`} style={styles.boldText}>
          {match[5]}
        </Text>
      );
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(
      <Text key={`text-${currentIndex}`}>{text.substring(currentIndex)}</Text>
    );
  }

  return parts.length > 0 ? parts : text;
};

interface PDFDocumentProps {
  title: string;
  content: string;
}

const PDFDocument: React.FC<PDFDocumentProps> = ({ title, content }) => {
  const sections = parseMarkdownContent(content);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {sections.map((section, index) => {
          switch (section.type) {
            case "title":
              return (
                <Text key={index} style={styles.subtitle}>
                  {renderTextWithFormatting(section.content)}
                </Text>
              );
            case "subtitle":
              return (
                <Text key={index} style={styles.heading1}>
                  {renderTextWithFormatting(section.content)}
                </Text>
              );
            case "heading1":
              return (
                <Text key={index} style={styles.heading2}>
                  {renderTextWithFormatting(section.content)}
                </Text>
              );
            case "paragraph":
              return (
                <Text key={index} style={styles.paragraph}>
                  {renderTextWithFormatting(section.content)}
                </Text>
              );
            case "code":
              return (
                <View key={index} style={styles.codeBlock}>
                  <Text>{section.content}</Text>
                </View>
              );
            case "list":
              return (
                <View key={index}>
                  {section.items?.map((item, itemIndex) => (
                    <View
                      key={`${index}-${itemIndex}`}
                      style={{ position: "relative" }}
                    >
                      <Text style={styles.listItemBullet}>•</Text>
                      <Text style={styles.listItem}>
                        {renderTextWithFormatting(item)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            case "table":
              return (
                <View key={index} style={styles.table}>
                  {section.tableData?.map((row, rowIndex) => (
                    <View
                      key={`${index}-row-${rowIndex}`}
                      style={
                        rowIndex === 0 ? styles.tableHeaderRow : styles.tableRow
                      }
                    >
                      {row.map((cell, cellIndex) => (
                        <View
                          key={`${index}-cell-${rowIndex}-${cellIndex}`}
                          style={styles.tableCol}
                        >
                          <Text
                            style={
                              rowIndex === 0
                                ? styles.tableHeaderCell
                                : styles.tableCell
                            }
                          >
                            {renderTextWithFormatting(cell)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              );
            case "separator":
              return <View key={index} style={styles.separator} />;
            case "note":
              return (
                <View key={index} style={styles.note}>
                  <Text>{renderTextWithFormatting(section.content)}</Text>
                </View>
              );
            default:
              return null;
          }
        })}
      </Page>
    </Document>
  );
};

export const generateAdvancedPDF = async (
  markdown: string,
  fileName: string
): Promise<Blob> => {
  const doc = <PDFDocument title={fileName} content={markdown} />;
  const pdfBlob = await pdf(doc).toBlob();
  return pdfBlob;
};

export default PDFDocument;
