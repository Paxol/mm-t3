export const typeToString = (type?: string) => {
  switch (type) {
    case "i":
      return "Entrata";
    case "o":
      return "Uscita";
    case "t":
      return "Trasferimento";

    default:
      return "";
  }
};

export const typeFormString = (type: string) => {
  switch (type) {
    case "Entrata":
    case "i":
    case "I":
      return "i";
    case "Uscita":
    case "o":
    case "O":
      return "o";
    case "Trasferimento":
    case "t":
    case "T":
      return "t";

    default:
      return "";
  }
};
