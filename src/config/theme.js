// Ant Design Theme Configuration
export const theme = {
  token: {
    // Colors
    colorPrimary: "#ff5532",
    colorSuccess: "#2e7d32",
    colorWarning: "#ffb80e",
    colorError: "#872822",
    colorInfo: "#1976d2",

    // Background
    colorBgBase: "#fdfdfd",
    colorBgLayout: "#f5f6f8",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",

    // Text
    colorText: "#0f232e",
    colorTextSecondary: "#5f6b73",
    colorTextDisabled: "#c4c4c4",

    // Border
    colorBorder: "#d9d9d9",
    colorBorderSecondary: "#ececec",

    // Border Radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 10,

    // Font
    fontFamily:
      '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 28,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    // Shadow
    boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
    boxShadowSecondary: "0 8px 30px rgba(0,0,0,0.04)",
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      siderBg: "#ffffff",
      bodyBg: "#f5f6f8",
    },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "#fff1ef",
      itemSelectedColor: "#ff5532",
      itemHoverBg: "#fff1ef",
      itemHoverColor: "#ff5532",
    },
    Button: {
      primaryShadow: "0 2px 8px rgba(255, 85, 50, 0.2)",
    },
    Card: {
      boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
      borderRadiusLG: 16,
    },
    Table: {
      headerBg: "#fafafa",
      rowHoverBg: "#fff1ef",
    },
  },
};
