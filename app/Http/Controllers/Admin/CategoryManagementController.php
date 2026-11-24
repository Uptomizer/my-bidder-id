<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryManagementController extends Controller
{
    /**
     * Display a listing of categories with auction counts.
     */
    public function index(): Response
    {
        $categories = Category::withCount('auctions')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:categories,name'],
            'description' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:50'],
        ], [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.unique' => 'Nama kategori ini sudah terdaftar.',
            'name.max' => 'Nama kategori maksimal 100 karakter.',
        ]);

        $baseSlug = Str::slug($request->string('name')->toString());
        $slug = $baseSlug ?: 'kategori';

        if (Category::where('slug', $slug)->exists()) {
            $slug .= '-' . Str::lower(Str::random(5));
        }

        Category::create([
            'name' => $request->string('name')->trim()->toString(),
            'slug' => $slug,
            'description' => $request->input('description'),
            'icon' => $request->input('icon') ?: '🏷️',
        ]);

        return back()->with('success', "Kategori '{$request->input('name')}' berhasil ditambahkan!");
    }

    /**
     * Remove the specified category.
     */
    public function destroy(int $id): RedirectResponse
    {
        $category = Category::withCount('auctions')->findOrFail($id);

        if ($category->auctions_count > 0) {
            return back()->with(
                'error',
                "Kategori '{$category->name}' tidak dapat dihapus karena masih digunakan oleh {$category->auctions_count} barang lelang."
            );
        }

        $name = $category->name;
        $category->delete();

        return back()->with('success', "Kategori '{$name}' berhasil dihapus!");
    }
}
