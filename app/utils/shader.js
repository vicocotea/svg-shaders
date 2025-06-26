// TODO: We can add more custom functions here to adjust the actual color
// in a declarative way (i.e. by leveraging the `type` field here). The implementation
// can be based on the <feColorMatrix> filter primitive and others.
export function texture(x, y) {
  return {
    type: "t",
    x,
    y,
  };
}
