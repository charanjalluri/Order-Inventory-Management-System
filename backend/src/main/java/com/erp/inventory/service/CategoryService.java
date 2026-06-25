package com.erp.inventory.service;

import com.erp.inventory.dto.CategoryDTO;
import com.erp.inventory.exception.BadRequestException;
import com.erp.inventory.exception.ResourceNotFoundException;
import com.erp.inventory.model.Category;
import com.erp.inventory.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    public Category createCategory(CategoryDTO dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new BadRequestException("Category name '" + dto.getName() + "' already exists!");
        }

        Category category = Category.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();

        if (dto.getParentId() != null) {
            Category parent = getCategoryById(dto.getParentId());
            category.setParentCategory(parent);
        }

        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, CategoryDTO dto) {
        Category category = getCategoryById(id);

        if (!category.getName().equals(dto.getName()) && categoryRepository.existsByName(dto.getName())) {
            throw new BadRequestException("Category name '" + dto.getName() + "' already exists!");
        }

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());

        if (dto.getParentId() != null) {
            if (dto.getParentId().equals(id)) {
                throw new BadRequestException("A category cannot be its own parent!");
            }
            Category parent = getCategoryById(dto.getParentId());
            category.setParentCategory(parent);
        } else {
            category.setParentCategory(null);
        }

        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        // Set children's parent to null or throw error if it has children?
        // To be safe, we will fetch other categories and null out their parent
        List<Category> allCategories = categoryRepository.findAll();
        for (Category cat : allCategories) {
            if (cat.getParentCategory() != null && cat.getParentCategory().getId().equals(id)) {
                cat.setParentCategory(null);
                categoryRepository.save(cat);
            }
        }
        categoryRepository.delete(category);
    }
}
