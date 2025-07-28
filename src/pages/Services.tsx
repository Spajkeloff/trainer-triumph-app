import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Plus,
  Package,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const Services = () => {
  const [activeTab, setActiveTab] = useState<"packages" | "memberships" | "classes" | "products">("packages");

  // Sample data
  const packages = [
    {
      id: "1",
      name: "Premium Training Package",
      description: "Comprehensive personal training with nutrition guidance",
      sessions: 20,
      duration: "60 minutes",
      price: "AED 2,800",
      pricePerSession: "AED 140",
      validity: "3 months",
      status: "active",
      clientsActive: 12
    },
    {
      id: "2",
      name: "Basic Training Package",
      description: "Essential personal training sessions",
      sessions: 10,
      duration: "45 minutes",
      price: "AED 1,200",
      pricePerSession: "AED 120",
      validity: "2 months",
      status: "active",
      clientsActive: 8
    },
    {
      id: "3",
      name: "Fitness Assessment Package",
      description: "Complete fitness evaluation and program design",
      sessions: 3,
      duration: "90 minutes",
      price: "AED 650",
      pricePerSession: "AED 217",
      validity: "1 month",
      status: "active",
      clientsActive: 3
    }
  ];

  const memberships = [
    {
      id: "1",
      name: "Unlimited Monthly Membership",
      description: "Unlimited access to group classes and gym facilities",
      price: "AED 450",
      billing: "Monthly",
      includes: ["Group Classes", "Gym Access", "Locker"],
      status: "active",
      members: 45
    },
    {
      id: "2",
      name: "Premium Annual Membership",
      description: "Full access with personal training sessions included",
      price: "AED 4,800",
      billing: "Annual",
      includes: ["Group Classes", "Gym Access", "4 PT Sessions", "Nutrition Plan"],
      status: "active",
      members: 12
    }
  ];

  const classes = [
    {
      id: "1",
      name: "HIIT Bootcamp",
      description: "High-intensity interval training for all fitness levels",
      duration: "45 minutes",
      capacity: 12,
      price: "AED 85",
      schedule: "Mon, Wed, Fri 7:00 AM",
      instructor: "Ahmed Al-Rashid",
      status: "active",
      enrolled: 8
    },
    {
      id: "2",
      name: "Yoga Flow",
      description: "Relaxing yoga session for flexibility and mindfulness",
      duration: "60 minutes",
      capacity: 15,
      price: "AED 75",
      schedule: "Tue, Thu 6:30 PM",
      instructor: "Sarah Al-Zahra",
      status: "active",
      enrolled: 12
    }
  ];

  const products = [
    {
      id: "1",
      name: "Protein Powder - Vanilla",
      description: "Premium whey protein for muscle recovery",
      price: "AED 180",
      category: "Supplements",
      stock: 25,
      status: "active"
    },
    {
      id: "2",
      name: "Resistance Bands Set",
      description: "Professional resistance bands for home workouts",
      price: "AED 95",
      category: "Equipment",
      stock: 15,
      status: "active"
    }
  ];

  const getStatusBadge = (status: string) => {
    return status === "active" ? 
      <Badge className="bg-success text-success-foreground">Active</Badge> : 
      <Badge variant="secondary">Inactive</Badge>;
  };

  const renderPackages = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <Card key={pkg.id} className="hover:shadow-elevated transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(pkg.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Package
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Package
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sessions</p>
                  <p className="font-medium">{pkg.sessions}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{pkg.duration}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Validity</p>
                  <p className="font-medium">{pkg.validity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active Clients</p>
                  <p className="font-medium">{pkg.clientsActive}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{pkg.price}</p>
                    <p className="text-sm text-muted-foreground">{pkg.pricePerSession} per session</p>
                  </div>
                  <Button size="sm">
                    Assign to Client
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderMemberships = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {memberships.map((membership) => (
        <Card key={membership.id} className="hover:shadow-elevated transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{membership.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{membership.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(membership.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Membership
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Membership
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Billing</p>
                  <p className="font-medium">{membership.billing}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active Members</p>
                  <p className="font-medium">{membership.members}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-card-foreground mb-2">Includes:</p>
                <div className="flex flex-wrap gap-2">
                  {membership.includes.map((item, index) => (
                    <Badge key={index} variant="outline">{item}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{membership.price}</p>
                    <p className="text-sm text-muted-foreground">per {membership.billing.toLowerCase()}</p>
                  </div>
                  <Button size="sm">
                    Assign to Client
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderClasses = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {classes.map((cls) => (
        <Card key={cls.id} className="hover:shadow-elevated transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{cls.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(cls.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Class
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Class
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{cls.duration}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-medium">{cls.capacity} people</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Schedule</p>
                  <p className="font-medium">{cls.schedule}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Enrolled</p>
                  <p className="font-medium">{cls.enrolled}/{cls.capacity}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Instructor</p>
                <p className="font-medium">{cls.instructor}</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{cls.price}</p>
                    <p className="text-sm text-muted-foreground">per session</p>
                  </div>
                  <Button size="sm">
                    Manage Bookings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderProducts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-elevated transition-all duration-300">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(product.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Product
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <p className="font-medium">{product.stock} units</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-primary">{product.price}</p>
                  <Button size="sm">
                    Sell Product
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Services</h1>
            <p className="text-muted-foreground">Manage your training packages, memberships, and products</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8 w-fit">
          {[
            { id: "packages", label: "Packages", icon: Package },
            { id: "memberships", label: "Memberships", icon: Users },
            { id: "classes", label: "Classes", icon: Calendar },
            { id: "products", label: "Products", icon: DollarSign }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center space-x-2"
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === "packages" && renderPackages()}
          {activeTab === "memberships" && renderMemberships()}
          {activeTab === "classes" && renderClasses()}
          {activeTab === "products" && renderProducts()}
        </div>
      </div>
    </div>
  );
};

export default Services;