// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";

// interface RecipeDialogProps {
//   recipe: RecipeCardProps | null;
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
// }

// export function RecipeDialog({
//   recipe,
//   open,
//   onOpenChange,
// }: RecipeDialogProps) {
//   if (!recipe) return null;

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>{recipe.title}</DialogTitle>
//           <DialogDescription>{recipe.description}</DialogDescription>
//         </DialogHeader>

//         <div className="space-y-2">
//           <p>
//             <strong>Time:</strong> {recipe.time}
//           </p>
//           <p>
//             <strong>Cuisine:</strong> {recipe.cuisine}
//           </p>
//           <p>
//             <strong>Spice Level:</strong> {recipe.spiceLevel}
//           </p>
//           <p>
//             <strong>Veg/Non-Veg:</strong>{" "}
//             <Badge variant={recipe.isVeg ? "default" : "destructive"}>
//               {recipe.isVeg ? "Vegetarian" : "Non-Veg"}
//             </Badge>
//           </p>

//           <div>
//             <strong>Ingredients:</strong>
//             <ul className="list-disc ml-6">
//               {recipe.ingredients.map((ing, idx) => (
//                 <li key={idx}>{ing}</li>
//               ))}
//             </ul>
//           </div>

//           <div>
//             <strong>Instructions:</strong>
//             <p>{recipe.instructions}</p>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
